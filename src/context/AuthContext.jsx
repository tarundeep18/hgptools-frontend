import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const verifyUser = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/verify`,
        { withCredentials: true },
      );

      if (data?.user) {
        setUser({
          _id: data.user._id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          phoneNumber: data.user.phoneNumber,
          companyName: data.user.companyName,
        });
        // console.log("✅ User verified:", data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log("❌ Verify failed:", error.response?.data || error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, verifyUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
