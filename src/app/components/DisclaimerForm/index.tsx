"use client";
import React, { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./style.scss";

interface DisclaimerFormProps {
  onClose?: () => void;
}

const DisclaimerForm = ({ onClose }: DisclaimerFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    rating: 0,
    suggestion: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.from("feedback").insert([
        {
          ...formData,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  if (submitted) {
    return (
      <div className="disclaimerForm">
        <div className="disclaimerContent" ref={modalRef}>
          <button className="closeButton" onClick={onClose}>
            ×
          </button>
          <h3>Thank you for your feedback!</h3>
          <p>We&apos;ll keep you updated on our progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="disclaimerForm">
      <div className="disclaimerContent" ref={modalRef}>
        <button className="closeButton" onClick={onClose}>
          ×
        </button>
        <h2>Coming Soon!</h2>
        <p>
          We&apos;re working hard to bring you new mentors and features.
          <br />
          Leave your contact information and we&apos;ll notify you when
          we&apos;re ready!
        </p>

        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <input
              type="text"
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="formGroup">
            <input
              type="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="formGroup">
            <input
              type="tel"
              placeholder="Your Phone (optional)"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="formGroup rating">
            <label>What do you think of this initiative?</label>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${formData.rating >= star ? "filled" : ""}`}
                  onClick={() => setFormData({ ...formData, rating: star })}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="formGroup">
            <textarea
              placeholder="Any suggestions or feedback?"
              value={formData.suggestion}
              onChange={(e) =>
                setFormData({ ...formData, suggestion: e.target.value })
              }
            />
          </div>

          <button type="submit" className="buttonStandard">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default DisclaimerForm;
