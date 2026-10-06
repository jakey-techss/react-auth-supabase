import { useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'
 
function App() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('') // NEW
  const [loading, setLoading] = useState(false)       // NEW
 
  const passwordsMatch = password === confirmPassword
  const canSubmit =
    fullName.trim() !== '' &&
    email.trim() !== '' &&
    password.length >= 6 &&
    passwordsMatch &&
    !loading // NEW: block double-clicks while saving
 
  // NEW: async lets us use await inside this function
  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')
 
    // 1. Validate again (never trust the button alone)
    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }
 
    setLoading(true)
 
    // 2. Create the account in Supabase Auth (auth.users)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    })
 
    if (signUpError) {
      setErrorMessage(signUpError.message) // e.g. "User already registered"
      setLoading(false)
      return
    }
 
    // If there is no session, email confirmation is turned on
    // and the insert below would be blocked by RLS.
    if (!data.session) {
      setErrorMessage('Account created, but email confirmation is on. Ask your teacher.')
      setLoading(false)
      return
    }
 
    // 3. Save the profile row in YOUR table (public.users)
    const { error: insertError } = await supabase.from('user_table').insert({
      id: data.user.id, // the same id Supabase Auth just created
      full_name: fullName.trim(),
      email: email.trim(),
    })
 
    if (insertError) {
      setErrorMessage('Account created, but saving your profile failed: ' + insertError.message)
      setLoading(false)
      return
    }
 
    // 4. Success! Show a message and clear the form
    setMessage(`Welcome, ${fullName.trim()}! Your account was created.`)
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setLoading(false)
  }
 
  return (
    <div className="page">
      <form className="signup-card" onSubmit={handleSubmit}>
        <h1>Create an account</h1>
        <p className="subtitle">Sign up to get started.</p>
 
        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          type="text"
          placeholder="Jane Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
 
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
 
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
 
        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          type="password"
          placeholder="Type it again"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
 
        {confirmPassword !== '' && !passwordsMatch && (
          <p className="error">Passwords do not match.</p>
        )}
 
        {/* NEW: the button text changes while saving */}
        <button type="submit" disabled={!canSubmit}>
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>
 
        {/* NEW: server errors and success messages */}
        {errorMessage && <p className="error server-error">{errorMessage}</p>}
        {message && <p className="success">{message}</p>}
      </form>
    </div>
  )
}
 
export default App