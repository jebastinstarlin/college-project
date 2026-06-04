import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import SignupPopup from "../components/SignupPopup";
import CallPopup from "../components/CallPopup";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import AchievementsSection from "../components/AchievementsSection";
import CoursesSection from "../components/CoursesSection";
import QuotesSection from "../components/QuotesSection";
import MentorsSection from "../components/MentorsSection";
import StudentLifeSection from "../components/StudentLifeSection";
import EventsGallery from "../components/EventsGallery";
import CounselorCTA from "../components/CounselorCTA";
import HiringStatsSection from "../components/HiringStatsSection";
import Footer from "../components/Footer";

export default function HomePage() {
  const { user } = useAuth();
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [showCallPopup, setShowCallPopup] = useState(false);

  const handleReachMentors = () => {
    if (!user && !sessionStorage.getItem("popupShown")) {
      setShowSignupPopup(true);
      sessionStorage.setItem("popupShown", "true");
    }
  };

  return (
    <div>
      {/* ── Visible to everyone ── */}
      <section id="home">
        <HeroSection />
      </section>

      <section id="about">
        <AboutSection />
      </section>

      <section id="achievements">
        <AchievementsSection />
      </section>

      <section id="courses">
        <CoursesSection />
      </section>

      <QuotesSection />

      <section id="mentors">
        <MentorsSection onReachMentors={handleReachMentors} />
      </section>

      {/* ── Gated content below Mentors ── */}
      {user ? (
        <>
          <section id="campus">
            <StudentLifeSection />
          </section>

          <section id="events">
            <EventsGallery />
          </section>

          <section id="counselor">
            <CounselorCTA onOpenCall={() => setShowCallPopup(true)} />
          </section>

          <section id="placements">
            <HiringStatsSection />
          </section>

          <Footer />
        </>
      ) : (
        <>
          <section
            id="campus"
            className="py-20 bg-cream text-center px-4"
          >
            <div className="max-w-xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 font-heading">
                Want to See More?
              </h2>
              <p className="text-gray-500 mb-8">
                Sign up to explore campus life, events, placement
                statistics, and talk to our AI counselor.
              </p>
              <button
                onClick={() => setShowSignupPopup(true)}
                className="bg-maroon text-white px-8 py-3 rounded-lg font-semibold hover:bg-maroon-dark transition-colors duration-200"
              >
                Sign Up to Unlock
              </button>
            </div>
          </section>

          <Footer />
        </>
      )}

      {/* ── Popups ── */}
      <SignupPopup
        show={showSignupPopup}
        onClose={() => setShowSignupPopup(false)}
      />
      <CallPopup
        open={showCallPopup}
        onClose={() => setShowCallPopup(false)}
      />
    </div>
  );
}