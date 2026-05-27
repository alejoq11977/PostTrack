"""
Tests for multi-clinic isolation, idempotent registration, and clinic-scoped views.

Firebase is mocked so the tests are deterministic and don't touch the network.
View tests use APIRequestFactory + force_authenticate (not the Django test Client)
so they mirror PRODUCTION: Firebase auth populates request.user at the DRF layer
and scoping is done by reading X-Clinic-Id inside the view (the Django middleware
sees an anonymous user for token auth and is a no-op).
"""
import uuid
from unittest import mock
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate


def _fake_fb_create_user(*args, **kwargs):
    """Each call returns a unique Firebase uid (firebase_uid is globally unique)."""
    return mock.Mock(uid=uuid.uuid4().hex)

from apps.users.models import User
from apps.clinics.models import Clinic, ClinicMembership
from apps.vet.serializers import (
    VetOwnerCreateSerializer,
    VetOwnerSerializer,
    VetOwnerUpdateSerializer,
    VetPatientCreateSerializer,
)
from apps.vet.api.views import VetOwnersListView
from apps.users.api.views import UserProfileAPIView


class _Req:
    def __init__(self, user):
        self.user = user


def _ctx(user, clinic):
    return {'request': _Req(user), 'clinic_ids': [clinic.id]}


@mock.patch('firebase_admin.auth.create_user', side_effect=_fake_fb_create_user)
class ClinicIsolationTests(TestCase):
    """Serializer-level: registration, per-clinic profiles, membership gating."""

    def setUp(self):
        self.vet = User.objects.create(email='vet@x.com', full_name='Vet', role='VETERINARIAN')
        self.c1 = Clinic.objects.create(name='C1', nit='N1', address='a', email='c1@x.com', phone='1')
        self.c2 = Clinic.objects.create(name='C2', nit='N2', address='a', email='c2@x.com', phone='1')

    def _register(self, clinic, **data):
        s = VetOwnerCreateSerializer(data=data, context=_ctx(self.vet, clinic))
        s.is_valid(raise_exception=True)
        return s.save()

    def test_registration_idempotent_by_email(self, _m):
        u1 = self._register(self.c1, full_name='Juan', email='juan@x.com',
                            identification_type='CC', identification_number='123',
                            phone_number='300', address='calle 1')
        u2 = self._register(self.c2, full_name='Juan P', email='juan@x.com',
                            identification_type='CC', identification_number='999',
                            phone_number='311', address='calle 2')
        self.assertEqual(u1.id, u2.id)
        self.assertEqual(User.objects.filter(email='juan@x.com').count(), 1)
        self.assertEqual(ClinicMembership.objects.filter(user=u1).count(), 2)

    def test_different_email_creates_separate_account(self, _m):
        u1 = self._register(self.c1, full_name='A', email='a@x.com',
                            identification_type='CC', identification_number='1', phone_number='', address='')
        u2 = self._register(self.c1, full_name='B', email='b@x.com',
                            identification_type='CC', identification_number='2', phone_number='', address='')
        self.assertNotEqual(u1.id, u2.id)

    def test_cannot_reregister_in_same_clinic(self, _m):
        from rest_framework.exceptions import ValidationError
        self._register(self.c1, full_name='Juan', email='dup@x.com',
                       identification_type='CC', identification_number='123', phone_number='', address='')
        s = VetOwnerCreateSerializer(
            data={'full_name': 'Juan X', 'email': 'dup@x.com', 'identification_type': 'CC',
                  'identification_number': '999', 'phone_number': '', 'address': ''},
            context=_ctx(self.vet, self.c1))
        self.assertTrue(s.is_valid(), s.errors)
        with self.assertRaises(ValidationError):
            s.save()

    def test_can_still_link_existing_person_to_other_clinic(self, _m):
        u1 = self._register(self.c1, full_name='Juan', email='link@x.com',
                            identification_type='CC', identification_number='123', phone_number='', address='')
        u2 = self._register(self.c2, full_name='Juan', email='link@x.com',
                            identification_type='CC', identification_number='456', phone_number='', address='')
        self.assertEqual(u1.id, u2.id)
        self.assertEqual(ClinicMembership.objects.filter(user=u1).count(), 2)

    def test_clinic_never_sets_password(self, _m):
        u = self._register(self.c1, full_name='Ana', email='ana@x.com',
                           identification_type='CC', identification_number='1',
                           phone_number='', address='')
        self.assertFalse(u.has_usable_password())

    def test_per_clinic_profiles_isolated(self, _m):
        u = self._register(self.c1, full_name='Juan', email='j@x.com',
                           identification_type='CC', identification_number='123',
                           phone_number='300', address='c1')
        self._register(self.c2, full_name='Juanito', email='j@x.com',
                       identification_type='CC', identification_number='999',
                       phone_number='311', address='c2')
        m1 = ClinicMembership.objects.get(user=u, clinic=self.c1)
        m2 = ClinicMembership.objects.get(user=u, clinic=self.c2)
        self.assertEqual((m1.phone_number, m1.identification_number, m1.address), ('300', '123', 'c1'))
        self.assertEqual((m2.phone_number, m2.identification_number, m2.address), ('311', '999', 'c2'))

    def test_owner_serializer_shows_selected_clinic_profile(self, _m):
        u = self._register(self.c1, full_name='Juan', email='j2@x.com',
                           identification_type='CC', identification_number='123',
                           phone_number='300', address='c1')
        self._register(self.c2, full_name='Juanito', email='j2@x.com',
                       identification_type='CC', identification_number='999',
                       phone_number='311', address='c2')
        d1 = VetOwnerSerializer(u, context=_ctx(self.vet, self.c1)).data
        d2 = VetOwnerSerializer(u, context=_ctx(self.vet, self.c2)).data
        self.assertEqual((d1['phone_number'], d1['identification_number']), ('300', '123'))
        self.assertEqual((d2['phone_number'], d2['identification_number']), ('311', '999'))

    def test_patient_creation_requires_membership_in_selected_clinic(self, _m):
        u = self._register(self.c1, full_name='Juan', email='j3@x.com',
                           identification_type='CC', identification_number='123',
                           phone_number='', address='')
        ok = VetPatientCreateSerializer(
            data={'name': 'Perro', 'species': 'Perro', 'breed': 'x',
                  'birth_date': '2020-01-01', 'current_weight': 10, 'owner_id': u.id},
            context=_ctx(self.vet, self.c1))
        self.assertTrue(ok.is_valid(), ok.errors)
        bad = VetPatientCreateSerializer(
            data={'name': 'Gato', 'species': 'Gato', 'breed': 'x',
                  'birth_date': '2020-01-01', 'current_weight': 4, 'owner_id': u.id},
            context=_ctx(self.vet, self.c2))
        self.assertFalse(bad.is_valid())
        self.assertIn('owner_id', bad.errors)

    def test_owner_update_writes_to_membership_only(self, _m):
        u = self._register(self.c1, full_name='Juan', email='j4@x.com',
                           identification_type='CC', identification_number='123',
                           phone_number='300', address='c1')
        self._register(self.c2, full_name='Juan', email='j4@x.com',
                       identification_type='CC', identification_number='999',
                       phone_number='311', address='c2')
        upd = VetOwnerUpdateSerializer(u, data={'phone_number': '555'}, partial=True,
                                       context=_ctx(self.vet, self.c1))
        upd.is_valid(raise_exception=True)
        upd.save()
        self.assertEqual(ClinicMembership.objects.get(user=u, clinic=self.c1).phone_number, '555')
        self.assertEqual(ClinicMembership.objects.get(user=u, clinic=self.c2).phone_number, '311')


@mock.patch('firebase_admin.auth.create_user', side_effect=_fake_fb_create_user)
class ClinicScopedViewTests(TestCase):
    """View-level (production-like): X-Clinic-Id read + validated inside the view."""

    factory = APIRequestFactory()

    def setUp(self):
        self.vet = User.objects.create(email='vet2@x.com', full_name='Vet2', role='VETERINARIAN')
        self.admin = User.objects.create(email='admin@x.com', full_name='Admin', role='ADMIN')
        self.c1 = Clinic.objects.create(name='VC1', nit='VN1', address='a', email='vc1@x.com', phone='1')
        self.c2 = Clinic.objects.create(name='VC2', nit='VN2', address='a', email='vc2@x.com', phone='1')
        ClinicMembership.objects.create(user=self.vet, clinic=self.c1, role='VETERINARIAN')
        self._register(self.c1, full_name='Owner C1', email='oc1@x.com',
                       identification_type='CC', identification_number='111', phone_number='100', address='a1')
        self._register(self.c2, full_name='Owner C2', email='oc2@x.com',
                       identification_type='CC', identification_number='222', phone_number='200', address='a2')

    def _register(self, clinic, **data):
        s = VetOwnerCreateSerializer(data=data, context=_ctx(self.vet, clinic))
        s.is_valid(raise_exception=True)
        return s.save()

    def _owners(self, user, clinic_id=None):
        kwargs = {}
        if clinic_id is not None:
            kwargs['HTTP_X_CLINIC_ID'] = str(clinic_id)
        req = self.factory.get('/api/vet/owners/', **kwargs)
        force_authenticate(req, user=user)
        resp = VetOwnersListView.as_view()(req)
        resp.render()
        return resp

    def test_vet_sees_only_selected_clinic(self, _m):
        resp = self._owners(self.vet, self.c1.id)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual([o['email'] for o in resp.data], ['oc1@x.com'])

    def test_vet_no_data_for_non_member_clinic(self, _m):
        resp = self._owners(self.vet, self.c2.id)  # vet is NOT a member of c2
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(list(resp.data), [])

    def test_admin_sees_any_clinic(self, _m):
        r1 = self._owners(self.admin, self.c1.id)
        r2 = self._owners(self.admin, self.c2.id)
        self.assertEqual([o['email'] for o in r1.data], ['oc1@x.com'])
        self.assertEqual([o['email'] for o in r2.data], ['oc2@x.com'])

    def test_no_clinic_header_returns_empty(self, _m):
        resp = self._owners(self.vet, clinic_id=None)
        self.assertEqual(list(resp.data), [])


@mock.patch('firebase_admin.auth.create_user', side_effect=_fake_fb_create_user)
class OwnerProfileScopingTests(TestCase):
    """The owner's /users/me/ profile is scoped to the active clinic's membership."""

    factory = APIRequestFactory()

    def setUp(self):
        self.vet = User.objects.create(email='vetp@x.com', full_name='VetP', role='VETERINARIAN')
        self.c1 = Clinic.objects.create(name='PC1', nit='PN1', address='a', email='pc1@x.com', phone='1')
        self.c2 = Clinic.objects.create(name='PC2', nit='PN2', address='a', email='pc2@x.com', phone='1')
        self.owner = self._register(self.c1, full_name='Ana C1', email='ana@x.com',
                                    identification_type='CC', identification_number='111',
                                    phone_number='100', address='dir1')
        self._register(self.c2, full_name='Ana C2', email='ana@x.com',
                       identification_type='CC', identification_number='999',
                       phone_number='200', address='dir2')

    def _register(self, clinic, **data):
        s = VetOwnerCreateSerializer(data=data, context=_ctx(self.vet, clinic))
        s.is_valid(raise_exception=True)
        return s.save()

    def _get(self, clinic_id):
        req = self.factory.get('/api/users/me/', HTTP_X_CLINIC_ID=str(clinic_id))
        force_authenticate(req, user=self.owner)
        resp = UserProfileAPIView.as_view()(req)
        resp.render()
        return resp

    def test_profile_shows_selected_clinic_data(self, _m):
        r1 = self._get(self.c1.id)
        r2 = self._get(self.c2.id)
        self.assertEqual((r1.data['phone_number'], r1.data['address']), ('100', 'dir1'))
        self.assertEqual((r2.data['phone_number'], r2.data['address']), ('200', 'dir2'))

    def test_profile_patch_updates_only_selected_clinic(self, _m):
        req = self.factory.patch('/api/users/me/', {'phone_number': '555'}, format='json',
                                 HTTP_X_CLINIC_ID=str(self.c1.id))
        force_authenticate(req, user=self.owner)
        resp = UserProfileAPIView.as_view()(req)
        resp.render()
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(ClinicMembership.objects.get(user=self.owner, clinic=self.c1).phone_number, '555')
        self.assertEqual(ClinicMembership.objects.get(user=self.owner, clinic=self.c2).phone_number, '200')
