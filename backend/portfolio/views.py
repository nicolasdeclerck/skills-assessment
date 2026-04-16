from __future__ import annotations

from django.db.models import Count, Max
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Activity, Skill
from .serializers import (
    ActivitySerializer,
    SkillAggregateSerializer,
    SkillSerializer,
)


class ActivityViewSet(viewsets.ModelViewSet):
    """CRUD for user activities. Data is strictly isolated per user."""

    serializer_class = ActivitySerializer

    def get_queryset(self):
        return (
            Activity.objects.filter(user=self.request.user)
            .prefetch_related("skills")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="skills-summary")
    def skills_summary(self, request):
        """Aggregate skills across all the user's activities.

        Returns, for each unique skill name, the max mastery level reached
        and the number of activities where it was exercised.
        """
        aggregated = (
            Skill.objects.filter(activity__user=request.user)
            .values("name")
            .annotate(max_level=Max("level"), activity_count=Count("activity", distinct=True))
            .order_by("-max_level", "name")
        )
        serializer = SkillAggregateSerializer(aggregated, many=True)
        return Response(serializer.data)


class SkillViewSet(viewsets.ModelViewSet):
    """CRUD for individual skills. Useful for granular edits from the UI."""

    serializer_class = SkillSerializer

    def get_queryset(self):
        return Skill.objects.filter(activity__user=self.request.user).select_related("activity")
