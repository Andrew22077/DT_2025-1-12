from rest_framework.permissions import BasePermission

class IsStaffUser(BasePermission):
    """
    Permiso que permite acceso solo a usuarios con is_staff=True
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
