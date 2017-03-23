from django.core.management.base import BaseCommand
from prototype.models import Topology, Device, Link


def natural_numbers():
    i = 1
    while True:
        yield i
        i += 1


class Command(BaseCommand):
    help = 'Creates a 2 tier clos topology with n nodes in the 1st tier and m nodes in the 2nd tier'

    def add_arguments(self, parser):
        parser.add_argument('n', type=int)
        parser.add_argument('m', type=int)

    def handle(self, *args, **options):

        n = options['n']
        m = options['m']

        print "n" , n
        print "m" , m

        topology = Topology(name="test_{0}".format(n), scale=1.0, panX=0, panY=0)
        topology.save()

        devices = []
        leaves = []
        spines = []

        id_seq = natural_numbers()

        tier2 = 100
        tier1 = 500
        spacing = 200

        tier2_centering = ((n - m) * 200)/2

        for i in xrange(n):
            device = Device(name="Leaf{0}".format(i),
                            x=i * spacing,
                            y=tier1,
                            id=next(id_seq),
                            type="switch",
                            topology_id=topology.pk)
            devices.append(device)
            leaves.append(device)

        for i in xrange(m):
            device = Device(name="Spine{0}".format(i),
                            x=(i * spacing) + tier2_centering,
                            y=tier2,
                            id=next(id_seq),
                            type="switch",
                            topology_id=topology.pk)
            devices.append(device)
            spines.append(device)

        print "leaves", leaves
        print "spines", spines

        Device.objects.bulk_create(devices)

        devices = {x.id: x for x in Device.objects.filter(topology_id=topology.pk)}

        links = []

        for leaf in leaves:
            for spine in spines:
                link = Link(from_device=devices[leaf.id],
                            to_device=devices[spine.id])
                links.append(link)
        Link.objects.bulk_create(links)

        print "Topology: ", topology.pk
