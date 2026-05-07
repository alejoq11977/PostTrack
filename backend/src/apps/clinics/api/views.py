from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import Clinic, VetClinic, DataPolicy, DataAuthorization, ClinicAuditLog
from ..serializers import (
    ClinicSerializer, VetClinicSerializer, VetClinicCreateSerializer,
    DataPolicySerializer, DataAuthorizationSerializer,
    AcceptTermsSerializer, ClinicAuditLogSerializer, ClinicAuditLogCreateSerializer,
    ClinicMinimalSerializer
)
from ..services import ClinicService, VetClinicService, DataTreatmentService, ClinicAuditLogService


class ClinicListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        clinics = ClinicService.get_user_clinics(request.user)
        serializer = ClinicSerializer(clinics, many=True)
        return Response(serializer.data)


class ClinicDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, clinic_id):
        user_clinic_ids = ClinicService.get_user_clinic_ids(request.user)

        if clinic_id not in user_clinic_ids:
            return Response(
                {"error": "No tienes acceso a esta clínica."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            clinic = Clinic.objects.get(id=clinic_id, is_active=True)
        except Clinic.DoesNotExist:
            return Response(
                {"error": "Clínica no encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ClinicSerializer(clinic)
        return Response(serializer.data)


class VetClinicLinkAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['ADMIN']:
            return Response(
                {"error": "Solo un administrador puede vincular veterinarios a clínicas."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = VetClinicCreateSerializer(data=request.data)
        if serializer.is_valid():
            vet_clinic = VetClinicService.link_vet_to_clinic(
                veterinarian=serializer.validated_data['veterinarian'],
                clinic=serializer.validated_data['clinic']
            )
            return Response(
                VetClinicSerializer(vet_clinic).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VetClinicUnlinkAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, vet_clinic_id):
        if request.user.role not in ['ADMIN']:
            return Response(
                {"error": "Solo un administrador puede desvincular veterinarios de clínicas."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            vet_clinic = VetClinic.objects.get(id=vet_clinic_id)
            vet_clinic.unlink()
            return Response({"message": "Veterinario desvinculado exitosamente."})
        except VetClinic.DoesNotExist:
            return Response(
                {"error": "Vínculo no encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )


class PendingTermsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        clinic_id = request.query_params.get('clinica_id')

        if not clinic_id:
            return Response(
                {"error": "Se requiere clinica_id como parámetro."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_clinic_ids = ClinicService.get_user_clinic_ids(request.user)

        try:
            clinic_id = int(clinic_id)
        except ValueError:
            return Response(
                {"error": "clinic_id debe ser un entero."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if clinic_id not in user_clinic_ids:
            return Response(
                {"error": "No tienes acceso a esta clínica."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            clinic = Clinic.objects.get(id=clinic_id, is_active=True)
        except Clinic.DoesNotExist:
            return Response(
                {"error": "Clínica no encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        pending_info = DataTreatmentService.get_pending_terms(request.user, clinic)

        return Response({
            'clinic': ClinicMinimalSerializer(clinic).data,
            'needs_acceptance': pending_info['needs_acceptance'],
            'policy': DataPolicySerializer(pending_info.get('policy')).data if pending_info.get('policy') else None,
            'authorization': DataAuthorizationSerializer(pending_info.get('authorization')).data if pending_info.get('authorization') else None
        })


class AllPendingTermsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pending_list = DataTreatmentService.get_all_pending_terms_for_user(request.user)

        result = []
        for item in pending_list:
            result.append({
                'clinic': ClinicMinimalSerializer(item['clinic']).data,
                'needs_acceptance': item['needs_acceptance'],
                'policy': DataPolicySerializer(item.get('policy')).data if item.get('policy') else None,
                'authorization': DataAuthorizationSerializer(item.get('authorization')).data if item.get('authorization') else None
            })

        return Response(result)


class AcceptTermsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AcceptTermsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        clinic_id = serializer.validated_data['clinic_id']
        policy_id = serializer.validated_data.get('policy_id')
        authorization_id = serializer.validated_data.get('authorization_id')

        user_clinic_ids = ClinicService.get_user_clinic_ids(request.user)
        if clinic_id not in user_clinic_ids:
            return Response(
                {"error": "No tienes acceso a esta clínica."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            clinic = Clinic.objects.get(id=clinic_id, is_active=True)
        except Clinic.DoesNotExist:
            return Response(
                {"error": "Clínica no encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        policy = None
        authorization = None

        if policy_id:
            policy = DataPolicy.objects.get(id=policy_id, clinic=clinic, is_active=True)

        if authorization_id:
            authorization = DataAuthorization.objects.get(id=authorization_id, clinic=clinic, is_active=True)

        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

        acceptance = DataTreatmentService.accept_terms(
            user=request.user,
            clinic=clinic,
            ip_address=ip,
            user_agent=user_agent,
            policy=policy,
            authorization=authorization
        )

        return Response({
            "message": "Términos aceptados exitosamente.",
            "acceptance": {
                'clinic_id': clinic.id,
                'accepted_at': acceptance.accepted_at,
                'policy_version': acceptance.policy_version,
                'authorization_version': acceptance.authorization_version
            }
        })


class DataPolicyDetailAPIView(APIView):
    permission_classes = []

    def get(self, request, policy_id):
        try:
            policy = DataPolicy.objects.get(id=policy_id, is_active=True)
        except DataPolicy.DoesNotExist:
            return Response(
                {"error": "Política no encontrada o no está activa."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = DataPolicySerializer(policy)
        return Response(serializer.data)


class DataAuthorizationDetailAPIView(APIView):
    permission_classes = []

    def get(self, request, authorization_id):
        try:
            authorization = DataAuthorization.objects.get(id=authorization_id, is_active=True)
        except DataAuthorization.DoesNotExist:
            return Response(
                {"error": "Autorización no encontrada o no está activa."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = DataAuthorizationSerializer(authorization)
        return Response(serializer.data)


class ClinicAuditLogAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, clinic_id):
        if request.user.role not in ['ADMIN', 'VETERINARIAN']:
            return Response(
                {"error": "No tienes permisos para ver los logs de auditoría."},
                status=status.HTTP_403_FORBIDDEN
            )

        user_clinic_ids = ClinicService.get_user_clinic_ids(request.user)
        if clinic_id not in user_clinic_ids:
            return Response(
                {"error": "No tienes acceso a esta clínica."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            clinic = Clinic.objects.get(id=clinic_id)
        except Clinic.DoesNotExist:
            return Response(
                {"error": "Clínica no encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        action = request.query_params.get('action')
        limit = int(request.query_params.get('limit', 100))

        logs = ClinicAuditLogService.get_clinic_audit_logs(clinic, action=action, limit=limit)
        serializer = ClinicAuditLogSerializer(logs, many=True)
        return Response(serializer.data)

    def post(self, request, clinic_id):
        user_clinic_ids = ClinicService.get_user_clinic_ids(request.user)
        if clinic_id not in user_clinic_ids:
            return Response(
                {"error": "No tienes acceso a esta clínica."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ClinicAuditLogCreateSerializer(data=request.data)
        if serializer.is_valid():
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

            log = ClinicAuditLogService.log(
                clinic=serializer.validated_data['clinic'],
                user=request.user,
                action=serializer.validated_data['action'],
                details=serializer.validated_data.get('details', {}),
                ip_address=ip,
                user_agent=user_agent
            )

            return Response(
                ClinicAuditLogSerializer(log).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClinicLogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, clinic_id):
        user_clinic_ids = ClinicService.get_user_clinic_ids(request.user)
        if clinic_id not in user_clinic_ids:
            return Response(
                {"error": "No tienes acceso a esta clínica."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            clinic = Clinic.objects.get(id=clinic_id)
        except Clinic.DoesNotExist:
            return Response(
                {"error": "Clínica no encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

        ClinicAuditLogService.log(
            clinic=clinic,
            user=request.user,
            action='LOGOUT',
            details={},
            ip_address=ip,
            user_agent=user_agent
        )

        return Response({"message": "Sesión cerrada exitosamente."})
