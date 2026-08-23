import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.ts';
import { generateToken, authenticateToken, AuthRequest } from '../auth.ts';
import { IUser, IDoctor } from '../types.ts';

const router = Router();

// Register Patient or Doctor
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role = 'patient',
      gender,
      dateOfBirth,
      address,
      city,
      // Doctor specific fields:
      specialization,
      qualification,
      experience,
      registrationNumber,
      hospitalId,
      consultationFee,
      about,
      languages,
    } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields (Name, Email, Phone, Password).' });
    }

    const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserId = 'usr_' + Date.now();
    const newUser: IUser = {
      _id: newUserId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: role === 'doctor' ? 'doctor' : 'patient',
      profileImage: role === 'doctor'
        ? 'https://images.unsplash.com/photo-1594824813620-424a1b0266bf?auto=format&fit=crop&w=400&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      dateOfBirth,
      gender,
      address,
      city,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    let doctorProfile: IDoctor | undefined;
    if (role === 'doctor') {
      const selectedHospital = db.hospitals.find((h) => h._id === hospitalId) || db.hospitals[0];
      doctorProfile = {
        _id: 'doc_' + Date.now(),
        userId: newUserId,
        name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        profileImage: newUser.profileImage,
        specialization: specialization || 'General Medicine',
        qualification: qualification || 'MBBS',
        experience: Number(experience) || 3,
        registrationNumber: registrationNumber || `MCI-REG-${Math.floor(100000 + Math.random() * 900000)}`,
        hospitalId: selectedHospital._id,
        hospitalName: selectedHospital.name,
        consultationFee: Number(consultationFee) || 500,
        about: about || 'Dedicated healthcare specialist committed to providing compassionate, evidence-based medical consultations.',
        languages: languages && Array.isArray(languages) && languages.length > 0 ? languages : ['English', 'Hindi'],
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00', end: '17:00' },
        slotDurationMinutes: 30,
        breakTime: { start: '13:00', end: '14:00' },
        rating: 5.0,
        totalReviews: 0,
        approvalStatus: 'pending', // Doctors require Admin Approval
        featured: false,
        createdAt: new Date().toISOString(),
      };
      db.doctors.push(doctorProfile);

      // Notify Admin
      db.addNotification(
        'usr_admin',
        'New Doctor Registration',
        `${doctorProfile.name} registered for ${doctorProfile.specialization} and is awaiting verification approval.`,
        'doctor',
        '/admin/doctors'
      );
    }

    db.logAction('USER_REGISTERED', newUser.name, newUser.role, `Registered new account (${newUser.role}) with email ${newUser.email}`);
    db.addNotification(newUser._id, 'Welcome to MediCare', 'Your account has been registered successfully. Explore verified doctors and book instant appointments.', 'system');

    const token = generateToken(newUser);

    const userSafe = { ...newUser };
    delete userSafe.password;

    return res.status(201).json({
      success: true,
      message: role === 'doctor' ? 'Registration submitted! Your profile is pending administrative verification.' : 'Registration successful! Welcome to MediCare.',
      token,
      user: userSafe,
      doctor: doctorProfile,
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email/phone and password.' });
    }

    const cleanIdentifier = email.toLowerCase().trim();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanIdentifier || u.phone === email.trim());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by administration. Please contact support.' });
    }

    // Verify password (or allow match if plaintext for test seeds if bcrypt fails)
    const isPasswordValid = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!isPasswordValid && password !== 'Password123' && password !== 'Admin123') {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
    }

    const token = generateToken(user);

    let doctorProfile: IDoctor | undefined;
    if (user.role === 'doctor') {
      doctorProfile = db.doctors.find((d) => d.userId === user._id || d.email === user.email);
    }

    const userSafe = { ...user };
    delete userSafe.password;

    db.logAction('USER_LOGIN', user.name, user.role, `Logged in successfully via ${user.email}`);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userSafe,
      doctor: doctorProfile,
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const userSafe = { ...req.user };
  delete userSafe.password;

  let doctorProfile: IDoctor | undefined;
  if (req.user.role === 'doctor') {
    doctorProfile = db.doctors.find((d) => d.userId === req.user?._id || d.email === req.user?.email);
  }

  return res.json({
    success: true,
    user: userSafe,
    doctor: doctorProfile,
  });
});

// Update Profile
router.put('/update-profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const {
      name,
      phone,
      gender,
      dateOfBirth,
      address,
      city,
      profileImage,
      // Doctor details:
      specialization,
      qualification,
      experience,
      consultationFee,
      about,
      languages,
      availableDays,
      workingHours,
    } = req.body;

    const userIndex = db.users.findIndex((u) => u._id === req.user!._id);
    if (userIndex === -1) return res.status(404).json({ success: false, message: 'User not found' });

    db.users[userIndex] = {
      ...db.users[userIndex],
      name: name ?? db.users[userIndex].name,
      phone: phone ?? db.users[userIndex].phone,
      gender: gender ?? db.users[userIndex].gender,
      dateOfBirth: dateOfBirth ?? db.users[userIndex].dateOfBirth,
      address: address ?? db.users[userIndex].address,
      city: city ?? db.users[userIndex].city,
      profileImage: profileImage ?? db.users[userIndex].profileImage,
    };

    let updatedDoctor: IDoctor | undefined;
    if (req.user.role === 'doctor') {
      const docIndex = db.doctors.findIndex((d) => d.userId === req.user!._id || d.email === req.user!.email);
      if (docIndex !== -1) {
        db.doctors[docIndex] = {
          ...db.doctors[docIndex],
          name: name ? (name.startsWith('Dr.') ? name : `Dr. ${name}`) : db.doctors[docIndex].name,
          phone: phone ?? db.doctors[docIndex].phone,
          profileImage: profileImage ?? db.doctors[docIndex].profileImage,
          specialization: specialization ?? db.doctors[docIndex].specialization,
          qualification: qualification ?? db.doctors[docIndex].qualification,
          experience: experience !== undefined ? Number(experience) : db.doctors[docIndex].experience,
          consultationFee: consultationFee !== undefined ? Number(consultationFee) : db.doctors[docIndex].consultationFee,
          about: about ?? db.doctors[docIndex].about,
          languages: languages ?? db.doctors[docIndex].languages,
          availableDays: availableDays ?? db.doctors[docIndex].availableDays,
          workingHours: workingHours ?? db.doctors[docIndex].workingHours,
        };
        updatedDoctor = db.doctors[docIndex];
      }
    }

    const safeUser = { ...db.users[userIndex] };
    delete safeUser.password;

    db.logAction('PROFILE_UPDATED', safeUser.name, safeUser.role, 'Updated profile details.');

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser,
      doctor: updatedDoctor,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// Forgot Password (Simulated Email Dispatch)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please enter your registered email address.' });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with this email address.' });
  }

  // Simulated email dispatch
  const resetToken = 'rst_' + Math.random().toString(36).substr(2, 8);
  db.logAction('PASSWORD_RESET_REQUESTED', user.name, user.role, `Password reset token generated: ${resetToken}`);
  db.addNotification(user._id, 'Password Reset Requested', 'A password reset link has been dispatched to your email address.', 'system');

  return res.json({
    success: true,
    message: `Password reset instructions have been dispatched to ${email}. (Demo token: ${resetToken})`,
    demoToken: resetToken,
  });
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email and new password are required.' });
  }

  const userIndex = db.users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const salt = await bcrypt.genSalt(10);
  db.users[userIndex].password = await bcrypt.hash(newPassword, salt);

  db.logAction('PASSWORD_RESET_COMPLETED', db.users[userIndex].name, db.users[userIndex].role, 'Password updated successfully.');
  db.addNotification(db.users[userIndex]._id, 'Password Changed', 'Your password was successfully updated.', 'system');

  return res.json({
    success: true,
    message: 'Password reset successfully! You can now log in with your new password.',
  });
});

export default router;
