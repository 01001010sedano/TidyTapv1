# TidyTap

A modern, comprehensive household task management application built with Next.js and TypeScript. TidyTap helps families and households organize, assign, and track daily tasks with AI-powered assistance and smart templates.

## 🚀 Features

### Core Task Management
- **Task Creation & Assignment**: Create tasks with detailed descriptions, priorities, categories, and due dates
- **Household Management**: Multi-user household system with role-based access (Manager/Helper)
- **Real-time Updates**: Live task synchronization across all household members
- **Task Templates**: Pre-built and customizable task templates for common household chores
- **Task Logging**: Complete history of completed tasks with timestamps and assignee tracking

### AI-Powered Features
- **Shrimpy AI Assistant**: Intelligent chatbot that helps with household tasks, recipes, and cleaning tips
- **Smart Task Suggestions**: AI-generated task recommendations based on household patterns
- **Daily Affirmations**: Personalized daily motivational messages powered by AI
- **Natural Language Task Creation**: Add tasks using natural language commands via chat

### Organization & Productivity
- **Calendar Integration**: Full calendar view with FullCalendar integration for task scheduling
- **Task Categories**: Organized task categories (Kitchen, Bathroom, Laundry, Living Room, etc.)
- **Priority Management**: High, Medium, Low priority system with visual indicators
- **Progress Tracking**: Visual progress indicators and completion statistics
- **Recurring Tasks**: Set up daily, weekly, or monthly recurring tasks

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Theme switching with system preference detection
- **Intuitive Dashboard**: Clean, modern interface with task summaries and quick actions
- **Role-Based Interface**: Different views for managers and helpers
- **Real-time Notifications**: Instant updates when tasks are completed or assigned

### Advanced Features
- **Household Codes**: Secure household joining system with unique codes
- **Task Editing**: Full task modification capabilities with history tracking
- **Supply Management**: Track required supplies and materials for tasks
- **Time Estimation**: Estimated completion times for better planning
- **Multi-step Tasks**: Break down complex tasks into manageable steps

## 🛠️ Technologies Used

- **Frontend Framework**: Next.js 15.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **AI Integration**: OpenAI GPT-3.5-turbo API
- **Calendar**: FullCalendar with React integration
- **State Management**: React hooks and context
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/01001010sedano/TidyTapv1.git
cd TidyTapv1
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your Firebase config

4. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI API Key (for AI features)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

5. Run the development server:
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎯 Usage

### Getting Started
1. **Sign Up**: Create an account using email and password
2. **Create/Join Household**: Either create a new household or join an existing one using a household code
3. **Set Role**: Choose between Manager (can create templates, assign tasks) or Helper (completes assigned tasks)

### Managing Tasks
- **Create Tasks**: Use the "Create Task" button or chat with Shrimpy using `/add` commands
- **Use Templates**: Managers can create and use task templates for common household chores
- **Assign Tasks**: Assign tasks to specific household members with due dates and priorities
- **Track Progress**: View completed tasks in the Task Log and monitor progress on the dashboard

### AI Assistant (Shrimpy)
- **Chat Interface**: Click the Shrimpy icon to open the AI assistant
- **Task Creation**: Use `/add [task description]` to create tasks via natural language
- **Household Help**: Ask for recipes, cleaning tips, or maintenance advice
- **Daily Affirmations**: Get personalized motivational messages each day

### Calendar & Organization
- **Calendar View**: See all tasks scheduled on the calendar
- **Task Categories**: Organize tasks by room or category (Kitchen, Bathroom, etc.)
- **Priority Levels**: Set High, Medium, or Low priorities for better organization
- **Recurring Tasks**: Set up tasks that repeat daily, weekly, or monthly

## 🤝 Contributing

Feel free to contribute to this project! Here's how:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏗️ Project Structure

```
TidyTap/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth-provider.tsx # Authentication context
│   ├── dashboard-layout.tsx # Main layout component
│   ├── ShrimpyChat.tsx   # AI assistant component
│   └── ...               # Other components
├── lib/                   # Utility libraries
│   ├── firebase.ts       # Firebase configuration
│   ├── task-templates.ts # Task template logic
│   └── utils.ts          # Utility functions
└── public/               # Static assets
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Dependencies
- **Next.js 15.2.4** - React framework
- **Firebase** - Backend services
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **OpenAI API** - AI features
- **FullCalendar** - Calendar integration

## 👥 Authors

- **01001010sedano** - Lead Developer & Maintainer

## 🙏 Acknowledgments

- **OpenAI** - For providing the GPT API that powers Shrimpy
- **Firebase** - For providing excellent backend services
- **Vercel** - For seamless deployment platform
- **Radix UI** - For accessible component primitives
- **Tailwind CSS** - For utility-first CSS framework
- **Next.js Team** - For the amazing React framework

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

⭐️ Star this project if you find it useful! 

🦐 **Shrimpy says**: "Keep your household tidy and organized with TidyTap!" 