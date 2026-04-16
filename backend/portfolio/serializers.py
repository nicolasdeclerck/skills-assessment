from __future__ import annotations

from rest_framework import serializers

from .models import Activity, Skill


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ("id", "name", "level", "created_at")
        read_only_fields = ("id", "created_at")


class SkillWriteSerializer(serializers.ModelSerializer):
    """Used when skills are written inline inside an Activity payload."""

    id = serializers.IntegerField(required=False)

    class Meta:
        model = Skill
        fields = ("id", "name", "level")


class ActivitySerializer(serializers.ModelSerializer):
    skills = SkillWriteSerializer(many=True, required=False)

    class Meta:
        model = Activity
        fields = (
            "id",
            "title",
            "description",
            "organization",
            "skills",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        skills_data = validated_data.pop("skills", [])
        activity = Activity.objects.create(**validated_data)
        for skill in skills_data:
            skill.pop("id", None)
            Skill.objects.create(activity=activity, **skill)
        return activity

    def update(self, instance, validated_data):
        skills_data = validated_data.pop("skills", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if skills_data is not None:
            existing = {s.id: s for s in instance.skills.all()}
            seen_ids: set[int] = set()
            for payload in skills_data:
                skill_id = payload.get("id")
                if skill_id and skill_id in existing:
                    skill = existing[skill_id]
                    skill.name = payload["name"]
                    skill.level = payload["level"]
                    skill.save()
                    seen_ids.add(skill_id)
                else:
                    Skill.objects.create(
                        activity=instance,
                        name=payload["name"],
                        level=payload["level"],
                    )
            # Remove skills that are no longer in the payload
            for skill_id, skill in existing.items():
                if skill_id not in seen_ids:
                    skill.delete()

        return instance


class SkillAggregateSerializer(serializers.Serializer):
    """Aggregated view across all activities: one row per unique skill."""

    name = serializers.CharField()
    max_level = serializers.IntegerField()
    activity_count = serializers.IntegerField()
