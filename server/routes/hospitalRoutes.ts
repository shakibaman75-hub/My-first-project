import { Router } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../auth.ts';
import { IHospital } from '../types.ts';

const router = Router();

// GET /api/hospitals - List & Filter Hospitals
router.get('/', (req, res) => {
  try {
    const {
      search = '',
      city = '',
      department = '',
      emergency = '',
    } = req.query as Record<string, string>;

    let results = db.hospitals.filter((hosp) => {
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesName = hosp.name.toLowerCase().includes(query);
        const matchesCity = hosp.city.toLowerCase().includes(query);
        const matchesAddress = hosp.address.toLowerCase().includes(query);
        const matchesDesc = hosp.description.toLowerCase().includes(query);
        if (!matchesName && !matchesCity && !matchesAddress && !matchesDesc) {
          return false;
        }
      }

      if (city && city !== 'All' && hosp.city.toLowerCase() !== city.toLowerCase()) {
        return false;
      }

      if (department && department !== 'All' && !hosp.departments.some((d) => d.toLowerCase() === department.toLowerCase())) {
        return false;
      }

      if (emergency === 'true' && !hosp.emergency24x7) {
        return false;
      }

      return true;
    });

    // Enrich with doctor count
    const enriched = results.map((hosp) => {
      const activeDoctors = db.doctors.filter((d) => d.hospitalId === hosp._id && d.approvalStatus === 'approved');
      return {
        ...hosp,
        doctorCount: activeDoctors.length,
      };
    });

    return res.json({
      success: true,
      total: enriched.length,
      hospitals: enriched,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch hospitals.' });
  }
});

// GET /api/hospitals/:id - Single Hospital with Affiliated Doctors
router.get('/:id', (req, res) => {
  try {
    const hospital = db.hospitals.find((h) => h._id === req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    const doctors = db.doctors.filter((d) => d.hospitalId === hospital._id && d.approvalStatus === 'approved');

    return res.json({
      success: true,
      hospital: {
        ...hospital,
        doctors,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch hospital details.' });
  }
});

// POST /api/hospitals - Admin Adds New Hospital
router.post('/', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    const {
      name,
      image,
      description,
      address,
      city,
      state,
      pincode,
      contact,
      departments,
      facilities,
      emergency24x7,
      totalBeds,
      establishedYear,
      coordinates,
    } = req.body;

    if (!name || !city || !address) {
      return res.status(400).json({ success: false, message: 'Name, City, and Address are required.' });
    }

    const newHospital: IHospital = {
      _id: 'hosp_' + Date.now(),
      name: name.trim(),
      image: image || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
      description: description || 'Modern healthcare facility providing comprehensive specialized outpatient and inpatient medical services.',
      address: address.trim(),
      city: city.trim(),
      state: state || 'State',
      pincode: pincode || '400001',
      contact: contact || {
        phone: '+91 1800 200 1234',
        emergency: '108',
        email: 'info@hospital.demo',
      },
      departments: departments && departments.length > 0 ? departments : ['General Medicine', 'Emergency'],
      facilities: facilities && facilities.length > 0 ? facilities : ['24/7 Emergency', 'Pharmacy', 'Diagnostic Lab'],
      rating: 4.8,
      totalReviews: 12,
      emergency24x7: emergency24x7 !== undefined ? Boolean(emergency24x7) : true,
      totalBeds: Number(totalBeds) || 250,
      establishedYear: Number(establishedYear) || 2010,
      coordinates: coordinates || { lat: 18.5204, lng: 73.8567 },
      createdAt: new Date().toISOString(),
    };

    db.hospitals.push(newHospital);
    db.logAction('HOSPITAL_ADDED', req.user!.name, 'admin', `Added new hospital ${newHospital.name} in ${newHospital.city}`);

    return res.status(201).json({
      success: true,
      message: 'Hospital created successfully.',
      hospital: newHospital,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create hospital.' });
  }
});

// PUT /api/hospitals/:id - Admin Updates Hospital
router.put('/:id', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    const hospIndex = db.hospitals.findIndex((h) => h._id === req.params.id);
    if (hospIndex === -1) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    db.hospitals[hospIndex] = {
      ...db.hospitals[hospIndex],
      ...req.body,
    };

    db.logAction('HOSPITAL_UPDATED', req.user!.name, 'admin', `Updated hospital details for ${db.hospitals[hospIndex].name}`);

    return res.json({
      success: true,
      message: 'Hospital updated successfully.',
      hospital: db.hospitals[hospIndex],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update hospital.' });
  }
});

// DELETE /api/hospitals/:id - Admin Deletes Hospital
router.delete('/:id', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    const hospIndex = db.hospitals.findIndex((h) => h._id === req.params.id);
    if (hospIndex === -1) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    const removed = db.hospitals.splice(hospIndex, 1)[0];
    db.logAction('HOSPITAL_DELETED', req.user!.name, 'admin', `Removed hospital ${removed.name}`);

    return res.json({
      success: true,
      message: 'Hospital deleted successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete hospital.' });
  }
});

export default router;
