from django.contrib import admin

from .models import Activity, Skill


class SkillInline(admin.TabularInline):
    model = Skill
    extra = 0


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "start_date", "end_date", "organization")
    list_filter = ("user",)
    search_fields = ("title", "description", "organization")
    inlines = [SkillInline]


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "level", "activity")
    list_filter = ("level",)
    search_fields = ("name",)
