import "./Auth.css";

const Auth = ({
  isRegistering,
  setIsRegistering,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  handleAuth,
}) => {
  return (
    <main className="auth-container">
      <form className="auth-form" onSubmit={handleAuth}>
        <h1>AI Data Intelligence Platform</h1>
        <h2>{isRegistering ? "Create Account" : "Welcome Back"}</h2>
        {isRegistering && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit">{isRegistering ? "Register" : "Login"}</button>

        <p>
          {isRegistering
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? "Login" : "Register"}
          </button>
        </p>
      </form>
    </main>
  );
};

export default Auth;
