// TODO: Implement Login Page
// - Dana Group branded login form
// - Email + password fields
// - JWT token stored in httpOnly cookie via API
// - Redirect to /mail/inbox on success
// - Show error message on failed login

// export default function LoginPage() {
//   return null;
// }
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        
        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img
            src="https://www.danagroup.com/dgc-logo.png"
            alt="Dana Group Logo"
            className="h-12"
          />
        </div>

        {/* <h2 className="text-2xl font-bold mb-6 text-center">
          Dana Group Login
        </h2> */}

        <form className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="p-3 border rounded"
          />

          <input
            type="password"
            placeholder="Password"
            className="p-3 border rounded"
          />

          <div className="flex justify-between text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-green-500"
              />
              Remember
            </label>

            <a href="#" className="text-red-500">
              Forgot Password?
            </a>
          </div>

          <button className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}