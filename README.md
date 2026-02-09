# Habit Tracker 📝

A personal habit tracking application built to learn and practice **React Native**. 

This project demonstrates a full-stack mobile application workflow, including authentication, database interactions, and modern UI patterns.

## 🛠️ Tech Stack

* **Framework**: [Expo](https://expo.dev/) (React Native)
* **Language**: TypeScript
* **Backend**: [Appwrite](https://appwrite.io/) (Auth & Database)
* **UI Library**: [React Native Paper](https://callstack.github.io/react-native-paper/)
* **Navigation**: Expo Router
* **Animations**: React Native Reanimated

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/habit-tracker.git](https://github.com/yourusername/habit-tracker.git)
    cd habit-tracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Appwrite Setup**
    * Ensure you have an Appwrite instance running (cloud or self-hosted).
    * Update your Appwrite configuration in `lib/appwrite.ts` with your *Project ID* and *Endpoint*.

4.  **Run the project**
    ```bash
    npx expo start
    ```

## 📱 Running on Devices

* **iOS Simulator**: Press `i` in the terminal after running the start command.
* **Android Emulator**: Press `a` in the terminal.
* **Physical Device**: Install the **Expo Go** app and scan the QR code.

## 📂 Project Structure

```text
app/
├── (tabs)/          # Main app screens (Home, Add Habit, Streaks)
├── auth.tsx         # Authentication screen
├── _layout.tsx      # Root layout & Context providers
lib/
├── appwrite.ts      # Appwrite SDK configuration
├── auth-context.tsx # Authentication state management

```

## 📝 Learning Goals

This project was created to explore:

* Integrating a backend-as-a-service (Appwrite) with React Native.
* Mastering `expo-router` for navigation.
* Handling global state with React Context.
* Building responsive layouts with React Native Paper.

## 📄 License

This project is for educational purposes. Feel free to use it as a reference!
