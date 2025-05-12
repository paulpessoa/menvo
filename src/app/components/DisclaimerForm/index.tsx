"use client"
import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import './style.scss';

const DisclaimerForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(0);
  const [suggestion, setSuggestion] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            name,
            email,
            phone,
            rating,
            suggestion,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (submitted) {
    return (
      <div className="disclaimerForm submitted">
        <h3>Thank you for your feedback!</h3>
        <p>We'll keep you updated about our launch in June.</p>
      </div>
    );
  }

  return (
    <div className="disclaimerForm">
      <div className="disclaimerContent">
        <h2>Coming Soon!</h2>
        <p>We're working hard to bring you more mentors and exciting features. Our official launch is scheduled for June 2024.</p>
        <p>Want to be notified when we launch? Leave your contact information below!</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="formGroup">
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="formGroup">
          <input
            type="tel"
            placeholder="Your Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="formGroup rating">
          <label>How do you feel about this initiative?</label>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= rating ? 'filled' : ''}`}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="formGroup">
          <textarea
            placeholder="Any suggestions for us? (optional)"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
          />
        </div>

        <button type="submit" className="buttonStandard">
          Submit
        </button>
      </form>
    </div>
  );
};

export default DisclaimerForm; 