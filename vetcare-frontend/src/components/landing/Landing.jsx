
// import React from 'react';
// import { useNavigate } from 'react-router-dom';

// const testimonials = [
//   {
//     name: 'Ravi Kumar',
//     text: 'VetCare helped me save my cattle with instant video consultation. The doctors are very supportive and knowledgeable!',
//     avatar: '🐮',
//   },
//   {
//     name: 'Priya Singh',
//     text: 'Booking appointments and getting prescriptions is so easy now. My farm is healthier than ever!',
//     avatar: '🐐',
//   },
// ];

// const features = [
//   {
//     icon: '📅',
//     title: 'Easy Appointments',
//     desc: 'Book with available doctors in seconds and get reminders for your animals.',
//   },
//   {
//     icon: '💬',
//     title: 'Live Chat & Video',
//     desc: 'Consult with vets via chat or video call, and share images for diagnosis.',
//   },
//   {
//     icon: '📄',
//     title: 'Treatment Records',
//     desc: 'Download prescriptions and view your farm’s medical history anytime.',
//   },
//   {
//     icon: '🔒',
//     title: 'Secure Dashboard',
//     desc: 'Your data is protected and always accessible from any device.',
//   },
// ];

// const Landing = () => {
//   const navigate = useNavigate();
//   return (
//     <section className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 px-0 md:px-8">
//       <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 py-12 px-4 md:px-12">
//         <div className="flex-1 flex flex-col items-start justify-center">
//           <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-blue-800 leading-tight">Welcome to <span className="text-green-600">VetCare</span></h1>
//           <p className="mb-8 text-xl text-gray-700 max-w-xl">
//             The all-in-one veterinary platform for farmers, pet owners, and doctors. Get instant animal healthcare, book appointments, and manage your farm’s medical records with ease.
//           </p>
//           <div className="flex gap-4 mb-8">
//             <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 text-lg" onClick={() => navigate('/register')}>Get Started</button>
//             <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 text-lg" onClick={() => navigate('/login')}>Login</button>
//           </div>
//         </div>
//         <div className="flex-1 flex items-center justify-center">
//           <img src="/photos/satyam-vet-photo.jpg" alt="VetCare Hero" className="rounded-3xl shadow-2xl w-[340px] h-[340px] object-cover border-8 border-blue-200" />
//         </div>
//       </div>

//       <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8 px-4">
//         {features.map((f, i) => (
//           <div key={i} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition-transform">
//             <div className="text-4xl mb-2">{f.icon}</div>
//             <h3 className="font-bold text-lg mb-2 text-blue-700">{f.title}</h3>
//             <p className="text-gray-600 text-base">{f.desc}</p>
//           </div>
//         ))}
//       </div>

//       <div className="w-full max-w-4xl mx-auto py-8 px-4">
//         <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">What Our Users Say</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           {testimonials.map((t, i) => (
//             <div key={i} className="bg-white rounded-xl shadow p-6 flex gap-4 items-center">
//               <div className="text-5xl">{t.avatar}</div>
//               <div>
//                 <div className="font-bold text-blue-700 mb-1">{t.name}</div>
//                 <div className="text-gray-700 text-base">{t.text}</div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="w-full text-center py-8 text-gray-500 text-sm">
//         &copy; {new Date().getFullYear()} VetCare. All rights reserved.
//       </div>
//     </section>
//   );
// };

// export default Landing;



import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const testimonials = [
  {
    name: 'Ravi Kumar',
    text: 'My buffalo was critically ill at midnight. VetCare\'s emergency consultation saved her life! Dr. Sharma guided me through the treatment via video call.',
    avatar: '🐮',
    role: 'Dairy Farmer, Punjab'
  },
  {
    name: 'Priya Singh',
    text: 'VetCare helps me manage vaccination schedules for my 50 goats. The health tracking feature is amazing for my livestock business.',
    avatar: '🐐',
    role: 'Livestock Owner, Rajasthan'
  },
  {
    name: 'Dr. Amit Sharma',
    text: 'Through VetCare, I can reach farmers in remote villages and provide quality veterinary care. It\'s revolutionizing rural animal healthcare.',
    avatar: '👨‍⚕️',
    role: 'Veterinary Doctor, Bihar'
  },
];

const features = [
  {
    icon: '🩺',
    title: 'Expert Veterinarians',
    desc: 'Connect with certified veterinary doctors specializing in livestock, dairy animals, and pets.',
  },
  {
    icon: '📱',
    title: 'Telemedicine Consultations',
    desc: 'Video calls, photo diagnosis, and instant medical advice from qualified veterinary professionals.',
  },
  {
    icon: '🏥',
    title: 'Medical Records & Prescriptions',
    desc: 'Digital health records, treatment history, and downloadable prescriptions for all your animals.',
  },
  {
    icon: '🚨',
    title: 'Emergency Animal Care',
    desc: '24/7 emergency veterinary support for critical animal health situations and urgent treatments.',
  },
  {
    icon: '🐄',
    title: 'Livestock Health Management',
    desc: 'Specialized care for cattle, buffalo, goats, sheep, and other farm animals with breeding support.',
  },
  {
    icon: '💊',
    title: 'Medicine & Vaccine Delivery',
    desc: 'Prescription medicines, vaccines, and veterinary supplies delivered directly to your farm.',
  },
  {
    icon: '📊',
    title: 'Animal Health Analytics',
    desc: 'Track vaccination schedules, health trends, breeding cycles, and preventive care reminders.',
  },
  {
    icon: '🌍',
    title: 'Rural Reach Program',
    desc: 'Bringing veterinary care to remote villages through mobile clinics and telemedicine.',
  },
];

const stats = [
  { number: '10,000+', label: 'Animals Treated' },
  { number: '500+', label: 'Certified Vets' },
  { number: '50+', label: 'Cities Covered' },
  { number: '24/7', label: 'Emergency Care' },
];

const Landing = () => {
  const navigate = useNavigate();
  const [showFounder, setShowFounder] = useState(false);
  
  return (
    <div className="min-h-screen w-full bg-white">
      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 px-4 md:px-8 pt-20 pb-16">{/* Updated: Modern slate-blue-emerald gradient */}
        <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 flex flex-col items-start justify-center">
            <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              🩺 Professional Veterinary Care Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-gray-900 leading-tight">
              <span className="text-blue-600">VetCare</span> - Where <span className="text-green-600">Animals</span> Get the Best Care
            </h1>
            <p className="mb-8 text-xl text-gray-600 max-w-xl leading-relaxed">
              India's leading veterinary platform connecting farmers, livestock owners, and pet parents with certified veterinary doctors. Expert animal healthcare at your fingertips - from routine checkups to emergency treatments.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <button 
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all text-lg" 
                onClick={() => navigate('/register')}
              >
                Get Started Free
              </button>
              <button 
                className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition-all text-lg"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              <button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm"
                onClick={() => navigate('/admin-login')}
              >
                👑 Admin
              </button>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-green-600">🩺</span> Certified Vets Only
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">⚡</span> Instant Consultation
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">🏆</span> Trusted by 10K+ Farmers
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-3xl opacity-20 blur-2xl"></div>
              
              {/* Dual-sided visual design */}
              <div className="relative bg-white rounded-3xl shadow-2xl w-[450px] h-[400px] border-4 border-white overflow-hidden">
                
                {/* Animals Side (Left) */}
                <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-br from-green-100 to-green-200 flex flex-col items-center justify-center p-6">
                  <h3 className="text-lg font-bold text-green-800 mb-4 text-center">Animals We Care For</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                      <div className="text-3xl mb-1">🐄</div>
                      <div className="text-xs font-semibold text-gray-700">Cattle</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                      <div className="text-3xl mb-1">🐐</div>
                      <div className="text-xs font-semibold text-gray-700">Goats</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                      <div className="text-3xl mb-1">🐕</div>
                      <div className="text-xs font-semibold text-gray-700">Dogs</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                      <div className="text-3xl mb-1">🐈</div>
                      <div className="text-xs font-semibold text-gray-700">Cats</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                      <div className="text-3xl mb-1">🐎</div>
                      <div className="text-xs font-semibold text-gray-700">Horses</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                      <div className="text-3xl mb-1">🐷</div>
                      <div className="text-xs font-semibold text-gray-700">Pigs</div>
                    </div>
                  </div>
                </div>

                {/* Doctor Side (Right) */}
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-br from-blue-100 to-blue-200 flex flex-col items-center justify-center p-6">
                  <h3 className="text-lg font-bold text-blue-800 mb-4 text-center">Expert Veterinarians</h3>
                  
                  {/* Doctor Avatar */}
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg">
                    👨‍⚕️
                  </div>
                  
                  {/* Doctor Info */}
                  <div className="text-center">
                    <div className="bg-white rounded-xl p-3 shadow-sm mb-3">
                      <div className="text-sm font-bold text-gray-800">Certified Vets</div>
                      <div className="text-xs text-gray-600">500+ Doctors</div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-3 shadow-sm mb-3">
                      <div className="text-sm font-bold text-gray-800">24/7 Available</div>
                      <div className="text-xs text-gray-600">Emergency Care</div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <div className="text-sm font-bold text-gray-800">Telemedicine</div>
                      <div className="text-xs text-gray-600">Video Consultation</div>
                    </div>
                  </div>
                </div>

                {/* Center Divider with VetCare Logo */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-4 border-gray-200 flex items-center justify-center shadow-lg z-10">
                  <div className="text-2xl">🩺</div>
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="w-full max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow border border-white/20">{/* Updated: Glass morphism effect */}
              <div className="text-4xl font-extrabold text-blue-600 mb-2">{stat.number}</div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="w-full py-20 px-4 bg-gradient-to-r from-gray-50 via-white to-gray-50">{/* Updated: Subtle gray gradient */}
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Our Mission & Vision</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Building a healthier future for animals and farming communities across India</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-sm rounded-3xl p-10 shadow-lg hover:shadow-xl transition-shadow border border-blue-100/50">{/* Updated: Glass morphism with blue theme */}
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
                🎯
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                To provide accessible, affordable, and quality veterinary services to every farmer, livestock owner, and pet parent across India, ensuring no animal suffers due to lack of timely medical attention.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                We bridge the gap between veterinary experts and animal owners through cutting-edge telemedicine technology, making professional animal healthcare available 24/7.
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 backdrop-blur-sm rounded-3xl p-10 shadow-lg hover:shadow-xl transition-shadow border border-emerald-100/50">{/* Updated: Glass morphism with emerald theme */}
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
                👁️
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                To become India's most trusted veterinary platform, creating a comprehensive healthcare ecosystem where every animal - from village cattle to urban pets - receives world-class medical attention.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                We envision a future where advanced veterinary care, powered by technology and compassion, transforms animal health outcomes and empowers farming communities nationwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Aim For */}
      <section className="w-full py-20 px-4 bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50">{/* Updated: Modern slate-blue-emerald gradient */}
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">What We Aim For</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Our core objectives to transform animal healthcare in India</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-white/30">{/* Updated: Glass morphism effect */}
              <div className="text-5xl mb-4">🌾</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Empower Farmers</h3>
              <p className="text-gray-600 leading-relaxed">
                Provide farmers with tools and knowledge to maintain healthy livestock, improve productivity, and increase income through better animal care practices.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-white/30">{/* Updated: Glass morphism effect */}
              <div className="text-5xl mb-4">🏥</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Accessible Healthcare</h3>
              <p className="text-gray-600 leading-relaxed">
                Make veterinary expertise available in remote areas through telemedicine, ensuring no animal is left without proper medical attention.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-5xl mb-4">💡</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Innovation in Care</h3>
              <p className="text-gray-600 leading-relaxed">
                Leverage technology to create smart solutions for disease prevention, early diagnosis, and efficient treatment management.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Build Community</h3>
              <p className="text-gray-600 leading-relaxed">
                Create a supportive network where farmers, vets, and experts share knowledge, experiences, and best practices for animal welfare.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Education & Training</h3>
              <p className="text-gray-600 leading-relaxed">
                Offer resources, workshops, and training programs to educate animal owners about preventive care and modern farming techniques.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Sustainable Growth</h3>
              <p className="text-gray-600 leading-relaxed">
                Promote sustainable farming practices that ensure animal welfare while supporting the economic growth of rural communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 px-4 bg-gradient-to-r from-white via-slate-50 to-white">{/* Updated: Subtle slate gradient */}
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Everything you need to manage your animal healthcare in one place</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-gradient-to-br from-white/90 to-slate-50/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-100/50">{/* Updated: Glass morphism with slate theme */}
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-20 px-4 bg-gradient-to-br from-blue-50 via-slate-50 to-emerald-50">{/* Updated: Blue-slate-emerald gradient */}
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Get started in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center border border-white/30">{/* Updated: Glass morphism effect */}
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Sign Up</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create your free account in minutes. Add your farm details and animal information to get personalized care.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center border border-white/30">{/* Updated: Glass morphism effect */}
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Connect with Vets</h3>
                <p className="text-gray-600 leading-relaxed">
                  Browse available veterinary doctors, check their profiles, and book instant appointments or video consultations.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center border border-white/30">{/* Updated: Glass morphism effect */}
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Get Treatment</h3>
                <p className="text-gray-600 leading-relaxed">
                  Receive expert diagnosis, prescriptions, and follow-up care. Track all medical records in your dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Core Doctors */}
      <section className="w-full py-20 px-4 bg-gradient-to-br from-slate-50 via-white to-blue-50">{/* Updated: Modern slate-white-blue gradient */}
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Our Core Doctors</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Meet our experienced veterinary professionals from top institutions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Doctor 1 */}
            <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-4">
                  👨‍⚕️
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Dr. Rajesh Kumar</h3>
                <div className="bg-blue-50 rounded-xl p-3 mb-4">
                  <p className="text-blue-700 font-semibold text-sm">MVSc, Animal Medicine</p>
                  <p className="text-blue-600 text-sm">Indian Veterinary Research Institute</p>
                </div>
                <div className="text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">🎓</span>
                    <span className="text-sm text-gray-700">15+ Years Experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">🐄</span>
                    <span className="text-sm text-gray-700">Large Animal Specialist</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">🏆</span>
                    <span className="text-sm text-gray-700">5000+ Animals Treated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor 2 */}
            <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-center">
                <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-4">
                  �‍⚕️
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Dr. Priya Sharma</h3>
                <div className="bg-pink-50 rounded-xl p-3 mb-4">
                  <p className="text-pink-700 font-semibold text-sm">BVSc & AH, Surgery</p>
                  <p className="text-pink-600 text-sm">Tamil Nadu Veterinary University</p>
                </div>
                <div className="text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">🎓</span>
                    <span className="text-sm text-gray-700">12+ Years Experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">🐕</span>
                    <span className="text-sm text-gray-700">Small Animal Expert</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">⚕️</span>
                    <span className="text-sm text-gray-700">Emergency Care Specialist</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor 3 */}
            <div className="bg-white rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-4">
                  👨‍⚕️
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Dr. Amit Patel</h3>
                <div className="bg-green-50 rounded-xl p-3 mb-4">
                  <p className="text-green-700 font-semibold text-sm">PhD, Animal Nutrition</p>
                  <p className="text-green-600 text-sm">Gujarat Agricultural University</p>
                </div>
                <div className="text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">🎓</span>
                    <span className="text-sm text-gray-700">18+ Years Experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">🌾</span>
                    <span className="text-sm text-gray-700">Livestock Nutrition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">📊</span>
                    <span className="text-sm text-gray-700">Farm Health Management</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Many More Doctors Message */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-2xl p-8 inline-block">
              <h4 className="text-2xl font-bold text-gray-900 mb-2">500+ More Expert Veterinarians</h4>
              <p className="text-gray-700 mb-4">
                Our platform features veterinary professionals from top institutions across India including IVRI, TANUVAS, AAU, and many more prestigious veterinary colleges.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <span className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-gray-700">IVRI Graduates</span>
                <span className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-gray-700">TANUVAS Alumni</span>
                <span className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-gray-700">AAU Experts</span>
                <span className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-gray-700">GADVASU Professionals</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-20 px-4 bg-gradient-to-r from-slate-50 via-white to-slate-50">{/* Updated: Subtle slate gradient */}
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Real stories from farmers and veterinary professionals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gradient-to-br from-blue-50/80 to-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-blue-100/50">{/* Updated: Glass morphism with blue theme */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">{t.avatar}</div>
                  <div>
                    <div className="font-bold text-lg text-gray-900">{t.name}</div>
                    <div className="text-sm text-gray-500">{t.role}</div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed italic">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-4 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600">{/* Updated: Modern blue-emerald gradient */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Ready to Transform Your Animal Care?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers and animal owners who trust VetCare for their veterinary needs. Start your journey today!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button 
              className="bg-white text-blue-600 px-10 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg" 
              onClick={() => navigate('/register')}
            >
              Get Started Now
            </button>
            <button 
              className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-bold hover:bg-white hover:text-blue-600 transition-all text-lg"
              onClick={() => navigate('/login')}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer with Contact & Career Portal */}
      <footer className="w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-gray-300 py-12 px-4">{/* Updated: Modern slate-gray gradient */}
        <div className="max-w-7xl mx-auto">
          {/* About Founder - Compact Version */}
          <div className="text-center mb-8 pb-6 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white mb-3">About the Founder</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">👨‍💻</div>
                <div className="text-left">
                  <div className="font-semibold text-white">Satyam Prajapati</div>
                  <div className="text-sm text-gray-400">Founder & Developer</div>
                </div>
              </div>
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all" 
                onClick={() => setShowFounder(true)}
              >
                Know More
              </button>
            </div>
          </div>

          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">VetCare</h3>
              <p className="text-gray-400">Connecting Farmers with Expert Veterinary Care</p>
            </div>
            <div className="flex flex-wrap gap-6 justify-center items-center mb-6">
              <a href="https://portfolio-rosy-tau-rws7s0np3k.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-semibold">Portfolio</a>
              <a href="/career-portal" className="text-green-400 underline font-semibold">Career Portal</a>
              <a href="mailto:satyam0777@gmail.com" className="text-gray-300 underline font-semibold">Contact: satyam0777@gmail.com</a>
            </div>
            <div className="border-t border-gray-700 pt-6">
              <p className="text-sm">&copy; {new Date().getFullYear()} VetCare. All rights reserved. Made with ❤️ for farmers and animals.</p>
            </div>
          </div>
        </div>
        
        {/* Modal Popout */}
        {showFounder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 relative animate-fade-in">
              <button className="absolute top-4 right-4 text-gray-500 hover:text-blue-700 text-2xl font-bold" onClick={() => setShowFounder(false)}>&times;</button>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-5xl mb-4">👨‍💻</div>
                <h3 className="text-3xl font-bold mb-2 text-center">Satyam Prajapati</h3>
                <p className="text-blue-700 text-center mb-4">Founder & Developer, VetCare</p>
                <a href="https://portfolio-rosy-tau-rws7s0np3k.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold mb-4">Portfolio</a>
                <a href="https://github.com/satyam0777" target="_blank" rel="noopener noreferrer" className="text-gray-900 underline font-semibold mb-4">GitHub</a>
                <div className="prose max-w-none text-left">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">The Story Behind VetCare</h4>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    I come from a village in India where most families depend on 1–2 cows or buffaloes for their livelihood. I've seen firsthand how difficult it is for farmers to get timely and affordable veterinary help — especially in remote areas.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Sometimes a delayed treatment leads to the death of the animal, directly impacting a family's income and survival. These aren't just animals — they're the backbone of rural livelihoods.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    As a developer and someone deeply connected to this community, I wanted to solve this — not just with technology, but with empathy and access.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    This project is not just a startup idea — it's a mission born from the land I come from. 🌾
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default Landing;