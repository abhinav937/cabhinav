// Work and Education Data
// This file contains all the information for the work history and education dialogs
// Edit this file to update your information easily

const workData = {
  annapurna: {
    title: "Annapurna Labs (Amazon)",
    role: "Hardware Engineering Intern",
    duration: "May 2025 - August 2025",
    location: "Austin, TX",
    description: "Working on ML accelerator cards"
  },
  wempec: {
    title: "WEMPEC",
    role: "Graduate Research Assistant",
    duration: "August 2024 - Present",
    location: "Madison, WI",
    description: "Researching pulsed power applications"
  },
  uw_ece: {
    title: "UW Madison ECE",
    role: "Teaching Assistant",
    duration: "January 2025 - May 2025",
    location: "Madison, WI",
    description: "Supporting ECE courses"
  },
  union_south: {
    title: "Union South",
    role: "Cashier and Server",
    duration: "August 2024 - December 2024",
    location: "Madison, WI"
  },
  peg: {
    title: "PEG",
    role: "Student Researcher",
    duration: "December 2022 - May 2024",
    location: "IIT Dharwad, India",
    description: "Researching power electronics"
  }
};

const educationData = {
  uw_madison: {
    title: "University of Wisconsin-Madison",
    degree: "MS in ECE",
    duration: "2024 - 2026",
    location: "Madison, WI",
    description: "Specializing in Power Electronics"
  },
  iit_dharwad: {
    title: "IIT Dharwad",
    degree: "BTech in Electrical Engineering",
    duration: "2020 - 2024",
    location: "Dharwad, Karnataka, India"
  }
};

// Export the data for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { workData, educationData };
} 