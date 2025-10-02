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
				// Find doctor by uniqueAccessLink
				const res = await api.get(`/doctors?uniqueAccessLink=${link}`);
				if (res.data && res.data.length > 0) {
					localStorage.setItem('doctor', JSON.stringify(res.data[0]));
				}
			} catch (err) {
				// ignore
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
