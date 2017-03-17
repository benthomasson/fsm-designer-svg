from django.contrib import admin

from prototype.models import Device

from prototype.models import Link

from prototype.models import Topology


class DeviceAdmin(admin.ModelAdmin):
    fields = ('topology', 'name', 'x', 'y', 'id',)
    raw_id_fields = ('topology',)


admin.site.register(Device, DeviceAdmin)


class LinkAdmin(admin.ModelAdmin):
    fields = ('from_device', 'to_device',)
    raw_id_fields = ('from_device', 'to_device',)


admin.site.register(Link, LinkAdmin)


class TopologyAdmin(admin.ModelAdmin):
    fields = ('name', 'id', 'scale', 'panX', 'panY',)
    raw_id_fields = ()


admin.site.register(Topology, TopologyAdmin)
