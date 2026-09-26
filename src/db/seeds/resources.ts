import { Organization, ServiceResource, Location, ResourceVerification } from '../../types';

export interface SeedResourcePackage {
  organization: Organization;
  service: ServiceResource;
  location: Location;
  verification: ResourceVerification;
}

export const HOUSTON_RESOURCE_SEEDS: SeedResourcePackage[] = [
  {
    organization: {
      id: 'org-1',
      name: 'Houston Senior Move Managers',
      description: 'NASMM-certified senior move management assisting families with sorting, packing, and transition logistics.',
      website: 'https://houstonseniormovemanagers.example.com',
    },
    service: {
      id: 'srv-1',
      organizationId: 'org-1',
      name: 'Full-Service Senior Move Coordination & Packing',
      category: 'senior_move_management',
      description: 'Specialized compassionate packing, floor planning, downsizing assistance, and move day setup.',
      costType: 'quote',
    },
    location: {
      id: 'loc-1',
      organizationId: 'org-1',
      address: '2400 Montrose Blvd',
      city: 'Houston',
      state: 'TX',
      zipCode: '77006',
      phone: '(713) 555-0142',
    },
    verification: {
      id: 'ver-1',
      serviceId: 'srv-1',
      verificationStatus: 'Verified listing',
      verificationSource: 'NASMM Directory & MoveWell Verification',
      lastVerifiedAt: '2026-09-01',
    },
  },
  {
    organization: {
      id: 'org-2',
      name: 'Careful Hands Transport & Moving',
      description: 'Licensed and insured local moving company specializing in senior residential moves.',
      website: 'https://carefulhandsmoving.example.com',
    },
    service: {
      id: 'srv-2',
      organizationId: 'org-2',
      name: 'Local Residential Senior Moving',
      category: 'moving',
      description: 'Professional movers with padded packing, furniture disassembly, loading, and setup.',
      costType: 'quote',
    },
    location: {
      id: 'loc-2',
      organizationId: 'org-2',
      address: '4100 Washington Ave',
      city: 'Houston',
      state: 'TX',
      zipCode: '77007',
      phone: '(713) 555-0188',
    },
    verification: {
      id: 'ver-2',
      serviceId: 'srv-2',
      verificationStatus: 'Verified listing',
      verificationSource: 'Texas DMV Motor Carrier & MoveWell Team',
      lastVerifiedAt: '2026-09-15',
    },
  },
  {
    organization: {
      id: 'org-3',
      name: 'Houston Furniture Bank',
      description: 'Nonprofit organization accepting furniture and household goods for families in need.',
      website: 'https://houstonfurniturebank.example.org',
    },
    service: {
      id: 'srv-3',
      organizationId: 'org-3',
      name: 'Donation Pickup & Receipt',
      category: 'donation',
      description: 'Scheduled home pickup for gently used furniture, kitchenware, and home goods.',
      costType: 'free_or_low_cost',
    },
    location: {
      id: 'loc-3',
      organizationId: 'org-3',
      address: '8220 Mosley Rd',
      city: 'Houston',
      state: 'TX',
      zipCode: '77075',
      phone: '(713) 555-0199',
    },
    verification: {
      id: 'ver-3',
      serviceId: 'srv-3',
      verificationStatus: 'Verified listing',
      verificationSource: '501(c)(3) Public Registry & MoveWell Team',
      lastVerifiedAt: '2026-09-10',
    },
  },
  {
    organization: {
      id: 'org-4',
      name: 'Space City Eco Junk Removal',
      description: 'Eco-friendly junk removal and property cleanout service in Harris County.',
      website: 'https://spacecityjunk.example.com',
    },
    service: {
      id: 'srv-4',
      organizationId: 'org-4',
      name: 'Estate & Home Cleanout Service',
      category: 'junk_removal',
      description: 'Full-service haul away, sorting for recycling, and broom-clean home preparation.',
      costType: 'quote',
    },
    location: {
      id: 'loc-4',
      organizationId: 'org-4',
      address: '1500 Main St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77002',
      phone: '(713) 555-0123',
    },
    verification: {
      id: 'ver-4',
      serviceId: 'srv-4',
      verificationStatus: 'Verified listing',
      verificationSource: 'MoveWell Verification Team',
      lastVerifiedAt: '2026-09-12',
    },
  },
  {
    organization: {
      id: 'org-5',
      name: 'SafeSteps Home Modifications Houston',
      description: 'Licensed contractor specializing in ADA ramps, bathroom grab bars, and senior safety modifications.',
      website: 'https://safestepshouston.example.com',
    },
    service: {
      id: 'srv-5',
      organizationId: 'org-5',
      name: 'Post-Hospital Accessibility Modifications',
      category: 'home_modification',
      description: 'Rapid-installation grab bars, stair lifts, non-slip flooring, and wheelchair ramp installation.',
      costType: 'quote',
    },
    location: {
      id: 'loc-5',
      organizationId: 'org-5',
      address: '3200 Shepherd Dr',
      city: 'Houston',
      state: 'TX',
      zipCode: '77098',
      phone: '(713) 555-0166',
    },
    verification: {
      id: 'ver-5',
      serviceId: 'srv-5',
      verificationStatus: 'Verified listing',
      verificationSource: 'Texas Licensing Board & MoveWell Team',
      lastVerifiedAt: '2026-09-20',
    },
  },
  {
    organization: {
      id: 'org-6',
      name: 'Bayou City Climate Storage',
      description: 'Secure, climate-controlled self storage facilities across central Houston.',
      website: 'https://bayoucitystorage.example.com',
    },
    service: {
      id: 'srv-6',
      organizationId: 'org-6',
      name: 'Climate-Controlled Storage Units',
      category: 'storage',
      description: 'Humidity-controlled 5x10, 10x10, and 10x20 storage units with ground-floor drive-up access.',
      costType: 'monthly',
    },
    location: {
      id: 'loc-6',
      organizationId: 'org-6',
      address: '1800 Heights Blvd',
      city: 'Houston',
      state: 'TX',
      zipCode: '77008',
      phone: '(713) 555-0177',
    },
    verification: {
      id: 'ver-6',
      serviceId: 'srv-6',
      verificationStatus: 'Verified listing',
      verificationSource: 'MoveWell Verification Team',
      lastVerifiedAt: '2026-09-18',
    },
  },
];
