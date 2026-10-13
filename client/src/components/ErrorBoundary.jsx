import { Component } from 'react';


class ErrorBoundary extends Component {
    // Creating a state to track whether an error has occurred.
   state = { hasError: false };

   // If an error is thrown, this method is called to show the state.
   static getDerivedStateFromError(error) {
        return { hasError: true };
   }

   // This method is called when an error is thrown in a child component.
   componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
   }
   
   //The screen will display a fallback UI when an error is caught.
   render() {
        if (this.state.hasError) {
            return (
                <main role="alert">
                    <h1>Something went wrong.</h1>
                    <p>Please try again later.</p>
                </main>
            );
        }

        return this.props.children;
   }
}

export default ErrorBoundary;