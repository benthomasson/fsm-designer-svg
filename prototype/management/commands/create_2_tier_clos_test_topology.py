from django.core.management.base import BaseCommand
from prototype.models import Topology, Device, Link


def natural_numbers():
    i = 1
    while True:
        yield i
        i += 1


class Command(BaseCommand):
    help = '''Creates a 2 tier clos topology with n nodes in the 1st tier and m nodes
            in the 2nd tier and h hosts per pair of switches'''

    def add_arguments(self, parser):
        parser.add_argument('n', type=int)
        parser.add_argument('m', type=int)
        parser.add_argument('h', type=int)

    def handle(self, *args, **options):

        n = options['n']
        m = options['m']
        h = options['h']

        print "n", n
        print "m", m

        topology = Topology(name="test_{0}".format(n), scale=1.0, panX=0, panY=0)
        topology.save()

        devices = []
        hosts_per_leaf = []
        leaves = []
        spines = []

        id_seq = natural_numbers()

        tier2 = 100
        tier1 = 500
        tier0 = 900
        spacing = 200

        tier2_centering = ((n - m) * 200) / 2

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

        for i in xrange(n / 2):
            hosts = []
            for j in xrange(h):
                device = Device(name="Host{0}-{1}".format(i, j),
                                x=(i * 2 * spacing) + spacing / 2,
                                y=tier0 + (j * 40),
                                id=next(id_seq),
                                type="host",
                                topology_id=topology.pk)
                devices.append(device)
                hosts.append(device)
            hosts_per_leaf.append(hosts)

        print "leaves", leaves
        print "spines", spines
        print "hosts_per_leaf", hosts_per_leaf

        Device.objects.bulk_create(devices)

        devices = {x.id: x for x in Device.objects.filter(topology_id=topology.pk)}

        links = []

        for leaf in leaves:
            for spine in spines:
                link = Link(from_device=devices[leaf.id],
                            to_device=devices[spine.id])
                links.append(link)
        for i, hosts in enumerate(hosts_per_leaf):
            leaf1 = leaves[2 * i]
            leaf2 = leaves[2 * i + 1]
            for j, host in enumerate(hosts):
                link = Link(from_device=devices[leaf1.id],
                            to_device=devices[host.id])
                links.append(link)
                link = Link(from_device=devices[leaf2.id],
                            to_device=devices[host.id])
                links.append(link)

        Link.objects.bulk_create(links)

        print "Topology: ", topology.pk
