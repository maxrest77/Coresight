# CoreSight AI

An advanced preventive health platform utilizing artificial intelligence to assess Liver and Pancreas health risks through biomarker analysis and clinical data insights.

##  Features

- **AI-Powered Early Detection**: Advanced algorithms analyze biomarkers for liver and pancreas risk assessment
- **Interactive Body Diagram**: Visual exploration of organ health with clickable regions
- **Personalized Dashboard**: User-specific health monitoring and diagnostic results
- **Secure Authentication**: Login/register system with protected routes
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme**: Customizable UI experience with theme persistence
- **Educational Content**: Comprehensive information about liver and pancreas health
- **Clinical Impact Analysis**: Data-driven insights for preventive care

##  Tech Stack

- **Frontend Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Context API
- **Backend**: Next.js API Routes
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18 or higher
- Package manager: npm, yarn, pnpm, or bun

##  Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/coresight.git
   cd coresight
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables** (if needed)
   Create a `.env.local` file in the root directory and add any required environment variables.

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

##  Usage

### For Users
- **Landing Page**: Learn about CoreSight AI and its capabilities
- **Registration/Login**: Create an account or sign in to access personalized features
- **Dashboard**: View your health assessment results and monitoring data
- **Diagnosis**: Use AI-powered tools to assess liver and pancreas health risks
- **Organ Information**: Explore detailed information about liver and pancreas health

### For Developers
- **API Routes**: Located in `app/api/` for liver and pancreas endpoints
- **Components**: Reusable UI components in `components/` directory
- **Context**: Authentication and theme contexts in `context/` directory
- **Utilities**: Helper functions in `lib/` directory

## 📁 Project Structure

```
coresight/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes (liver, pancreas)
│   ├── dashboard/         # User dashboard
│   ├── diagnosis/         # Diagnosis tools
│   ├── liver-info/        # Liver health information
│   ├── pancreas-info/     # Pancreas health information
│   ├── login/             # Authentication
│   └── register/          # User registration
├── components/            # Reusable React components
│   ├── ui/               # UI components (Button, Card, Input)
│   ├── LandingPage/      # Landing page sections
│   └── ...               # Other components
├── context/               # React contexts
│   ├── AuthContext.tsx   # Authentication state
│   └── ThemeProvider.tsx # Theme management
├── lib/                  # Utility functions
├── providers/            # Additional providers
└── public/               # Static assets (videos, images)
```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

The project uses ESLint for code linting. Run `npm run lint` to check for issues.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows our coding standards and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Medical Disclaimer

**IMPORTANT**: CoreSight AI is designed for educational and informational purposes only. The AI-powered assessments and health insights provided by this platform are not intended to constitute medical advice, diagnosis, or treatment. This tool should not be used as a substitute for professional medical consultation, diagnosis, or treatment.

- Always consult with qualified healthcare professionals for medical concerns
- The platform's risk assessments are based on general data and algorithms, not individual medical history
- Results should be interpreted in consultation with medical experts
- The developers and maintainers of CoreSight AI are not liable for any decisions made based on the platform's outputs

## 📞 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Contact the development team

## 🔄 Future Enhancements

- [ ] Integration with wearable health devices
- [ ] Advanced biomarker analysis algorithms
- [ ] Multi-language support
- [ ] Offline functionality
- [ ] Integration with electronic health records (EHR)

---

