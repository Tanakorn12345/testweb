"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// The hook now accepts an object with the 'role' property as its argument.
export const useRegister = ({ role }) => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        // The 'role' is passed in from the page, so it's no longer needed in the form's state.
    });
    const [error, setError] = useState(null);

    // This function updates the state as the user types in the form fields.
    const handleChange = (e) => {
        const { name, value } = e.target;
        setError(null); // Clear previous errors on new input.
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // This function is called when the registration form is submitted.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // --- Basic client-side validation ---
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // The 'role' received from the page is combined with the form data before sending.
                body: JSON.stringify({ ...formData, role }),
            });

            if (response.ok) {
                // If registration is successful, show a confirmation and redirect the user to the login page.
                alert('Registration successful! Please log in.');
                router.push('/login');
            } else {
                // If the API returns an error, display it to the user.
                const data = await response.json();
                setError(data.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            // Handle network errors or other unexpected issues.
            console.error('Registration fetch error:', err);
            setError('Could not connect to the server.');
        }
    };

    // Return the state and functions needed by the RegisterForm component.
    return { formData, error, handleChange, handleSubmit };
};