import { useState } from "react";

const ResetPassword = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: any) => {
    e.preventDefault();
    alert("Go to Forgot Password instead");
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleSubmit} className="p-6 border rounded space-y-4">
        <h2 className="text-xl font-bold">Reset Password</h2>

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button className="bg-blue-500 text-white w-full p-2">
          Continue
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;