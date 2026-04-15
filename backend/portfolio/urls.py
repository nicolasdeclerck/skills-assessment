from rest_framework.routers import DefaultRouter

from .views import ActivityViewSet, SkillViewSet

router = DefaultRouter()
router.register("activities", ActivityViewSet, basename="activity")
router.register("skills", SkillViewSet, basename="skill")

urlpatterns = router.urls
