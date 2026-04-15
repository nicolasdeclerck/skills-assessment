from __future__ import annotations

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Activity(models.Model):
    """A career activity (job, project, mission...) owned by a user."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activities",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    organization = models.CharField(max_length=200, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date", "-created_at"]
        indexes = [models.Index(fields=["user", "-start_date"])]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.title


class Skill(models.Model):
    """A skill exercised during an activity, with a mastery level 1-5."""

    class Level(models.IntegerChoices):
        NOVICE = 1, "Novice"
        BEGINNER = 2, "Débutant"
        INTERMEDIATE = 3, "Intermédiaire"
        ADVANCED = 4, "Avancé"
        EXPERT = 5, "Expert"

    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name="skills",
    )
    name = models.CharField(max_length=120)
    level = models.PositiveSmallIntegerField(
        choices=Level.choices,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["activity", "name"],
                name="unique_skill_per_activity",
            )
        ]

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.name} (level {self.level})"
