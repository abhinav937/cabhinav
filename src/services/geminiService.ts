// Gemini AI Service for Command Center - Currently disabled
// To enable: Set up environment variable and uncomment the API code below

export const askZenith = async (query: string): Promise<string> => {
  // Gemini API is currently disabled
  // Return a helpful fallback response
  return `Thank you for your query: "${query}". I'm Zenith, Abhinav's AI assistant. Currently, I'm operating in demo mode without API access. 

Abhinav is a graduate student researcher at UW-Madison specializing in Power Electronics and Pulsed Power applications. His research focuses on:
- GaN inverters and high-frequency power conversion
- Solid-state circuit breakers (SSCB)
- Marx generators and pulsed power systems
- Embedded systems and FPGA-based control
- PCB design for high-frequency applications

For detailed inquiries, please contact Abhinav directly through his social media profiles or email.`;
};
