import React from 'react';
import { useNavigate } from 'react-router-dom'; // ADD THIS
import { User, Mail, Phone, MapPin, Calendar, Edit } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const userData = {
    name: 'Kamal Perera',
    email: 'kamal@ceylonleaf.com',
    phone: '+94 77 123 4567',
    position: 'Production Manager',
    estate: 'Nuwara Eliya Estate',
    joinedDate: '2023-01-15',
    department: 'Tea Production' 
  };


  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-4xl mx-auto">
        
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">My Profile</h1>
          <p className="text-gray-400">Manage your account information</p>
        </div>


        <div className="mb-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
            ← Back
        </button>
        </div>

        

        <div className="bg-base-100 p-4 rounded-lg shadow mb-4 border border-gray-700">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{userData.name}</h2>
              <p className="text-gray-600">{userData.position}</p>
            </div>
          </div>

       
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{userData.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{userData.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Estate</p>
                  <p className="font-medium">{userData.estate}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{userData.department}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Joined Date</p>
                  <p className="font-medium">{userData.joinedDate}</p>
                </div>
              </div>
            </div>
          </div>

          
          <div className="mt-6 pt-6 border-t">
            <button className="btn btn-primary">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          </div>
        </div>

      
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-base-100 p-4 rounded-lg shadow mb-2 border border-gray-700 text-center">
            <p className="text-2xl font-bold text-blue-600">156</p>
            <p className="text-gray-600">Batches Managed</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow mb-2 border border-gray-700 text-center">
            <p className="text-2xl font-bold text-green-600">1,240</p>
            <p className="text-gray-600">Kg Processed</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow mb-2 border border-gray-700 text-center">
            <p className="text-2xl font-bold text-purple-600">98%</p>
            <p className="text-gray-600">Quality Score</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;