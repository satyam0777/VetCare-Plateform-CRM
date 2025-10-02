import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

import Dashboard from '../components/doctor/Dashboard';
import DoctorProfile from '../components/doctor/DoctorProfile';
import DoctorProfileSection from '../components/doctor/DoctorProfileSection';

const DoctorDashboardPage = () => {
	const { link } = useParams();

	useEffect(() => {
		const fetchDoctor = async () => {
			try {
				// ✅ Clear any existing user/admin tokens when accessing doctor dashboard
				console.log('🔧 Clearing any existing admin/user tokens for doctor access');
				localStorage.removeItem('token');
				localStorage.removeItem('user');
				localStorage.removeItem('userRole');
				
				// Find doctor by uniqueAccessLink
				const res = await api.get(`/doctors?uniqueAccessLink=${link}`);
				if (res.data && res.data.length > 0) {
					const doctor = res.data[0];
					localStorage.setItem('doctor', JSON.stringify(doctor));
					console.log('✅ Doctor data stored:', { id: doctor._id, name: doctor.name, link: link });
				} else {
					console.error('❌ No doctor found for link:', link);
				}
			} catch (err) {
				console.error('❌ Error fetching doctor:', err);
			}
		};
		if (link) fetchDoctor();
	}, [link]);

			return (
				<>
					<Dashboard />
				</>
			);
};

export default DoctorDashboardPage;
