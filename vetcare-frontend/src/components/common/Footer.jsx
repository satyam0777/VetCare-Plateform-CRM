import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [showFounder, setShowFounder] = useState(false);
  
  return (
    <>
      <footer className="w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-gray-300 mt-auto">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* VetCare Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl text-white">
                  🩺
                </div>
                <h3 className="text-2xl font-bold">
                  <span className="text-blue-300">Vet</span><span className="text-emerald-300">Care</span>
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                India's leading veterinary platform connecting farmers, livestock owners, and pet parents with certified veterinary doctors.
              </p>
              <div className="flex space-x-4">
                <a href="https://github.com/satyam0777" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center transition-colors">
                  <span className="text-lg">💻</span>
                </a>
                <a href="https://portfolio-rosy-tau-rws7s0np3k.vercel.app" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center transition-colors">
                  <span className="text-lg">🌐</span>
                </a>
                <a href="mailto:satyam0777@gmail.com" className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center transition-colors">
                  <span className="text-lg">📧</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Quick Links</h4>
              <ul className="space-y-3">
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"><span>🏠</span> Home</Link></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"><span>🔐</span> Login</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"><span>📝</span> Register</Link></li>
                <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"><span>📊</span> Dashboard</Link></li>
                <li><a href="/career-portal" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"><span>💼</span> Career Portal</a></li>
              </ul>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Our Services</h4>
              <ul className="space-y-3">
                <li className="text-gray-400 flex items-center gap-2"><span>🩺</span> Expert Veterinarians</li>
                <li className="text-gray-400 flex items-center gap-2"><span>📱</span> Telemedicine Consultations</li>
                <li className="text-gray-400 flex items-center gap-2"><span>🚨</span> Emergency Animal Care</li>
                <li className="text-gray-400 flex items-center gap-2"><span>🐄</span> Livestock Health Management</li>
                <li className="text-gray-400 flex items-center gap-2"><span>💊</span> Medicine & Vaccine Delivery</li>
                <li className="text-gray-400 flex items-center gap-2"><span>📊</span> Health Analytics</li>
              </ul>
            </div>

            {/* Contact & Support */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Contact & Support</h4>
              <ul className="space-y-3">
                <li className="text-gray-400 flex items-center gap-2">
                  <span>📧</span> 
                  <a href="mailto:vetcare0777@gmail.com" className="hover:text-white transition-colors">
                    vetcare0777@gmail.com
                  </a>
                </li>
                <li className="text-gray-400 flex items-center gap-2"><span>⚡</span> 24/7 Emergency Support</li>
                <li className="text-gray-400 flex items-center gap-2"><span>🔒</span> Secure & Private</li>
                <li className="text-gray-400 flex items-center gap-2"><span>🌍</span> Serving All India</li>
              </ul>
              
              {/* About Founder Link */}
              <div className="mt-6">
                <button 
                  onClick={() => setShowFounder(true)}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  <span>👨‍💻</span> About the Founder
                </button>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-400">10K+</div>
                <div className="text-sm text-gray-400">Animals Treated</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-emerald-400">500+</div>
                <div className="text-sm text-gray-400">Certified Vets</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-400">50+</div>
                <div className="text-sm text-gray-400">Cities Covered</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-400">24/7</div>
                <div className="text-sm text-gray-400">Emergency Care</div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} VetCare. All rights reserved. Made with ❤️ for farmers and animals.
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Founder Modal */}
      {showFounder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full mx-4 p-8 relative">
            <button 
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors" 
              onClick={() => setShowFounder(false)}
            >
              ✕
            </button>
            
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-5xl mb-4">👨‍💻</div>
              <h3 className="text-3xl font-bold mb-2 text-center">Satyam Prajapati</h3>
              <p className="text-blue-700 text-center mb-4">Founder & Developer, VetCare</p>
              
              <div className="flex gap-4 mb-6">
                <a href="https://portfolio-rosy-tau-rws7s0np3k.vercel.app" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors">Portfolio</a>
                <a href="https://github.com/satyam0777" target="_blank" rel="noopener noreferrer" className="bg-gray-900 text-white px-4 py-2 rounded-xl font-semibold hover:bg-gray-800 transition-colors">GitHub</a>
              </div>
              
              <div className="prose max-w-none text-left">
                <h4 className="text-xl font-bold text-gray-900 mb-3">The Story Behind VetCare</h4>
                <p className="text-gray-700 leading-relaxed mb-3">
                  I come from a village in India where most families depend on 1–2 cows or buffaloes for their livelihood. I've seen firsthand how difficult it is for farmers to get timely and affordable veterinary help — especially in remote areas.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Sometimes a delayed treatment leads to the death of the animal, directly impacting a family's income and survival. These aren't just animals — they're the backbone of rural livelihoods.
                </p>
                <p className="text-gray-700 leading-relaxed mb-3">
                  As a developer and someone deeply connected to this community, I wanted to solve this — not just with technology, but with empathy and access.
                </p>
                <p className="text-gray-700 leading-relaxed font-semibold">
                  This project is not just a startup idea — it's a mission born from the land I come from. 🌾
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
