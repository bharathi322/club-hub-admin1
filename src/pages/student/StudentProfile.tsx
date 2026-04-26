import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRegistrations, useMyFeedback } from "@/hooks/use-dashboard-api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "@/api/api";

const StudentProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const { data: registrations = [] } = useMyRegistrations();
  const { data: feedbackHistory = [] } = useMyFeedback();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  if (!user) return <div className="p-6">Loading...</div>;

  const initials = user.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const activeCount = registrations.filter(
    (r: any) => r.status === "registered"
  ).length;

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setImage(URL.createObjectURL(file));
  };


const handleSave = async () => {
  try {
    const formData = new FormData();
    formData.append("name", name);

    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    const res = await api.put("/user/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // update everywhere
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setUser(res.data.user); // ✅ THIS FIXES UI

    setOpen(false);

    console.log("PROFILE UPDATED");

  } catch (err) {
    console.error("UPDATE ERROR:", err);
  }
};

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 flex justify-between items-center">
        <div className="flex gap-4 items-center">

          {/* AVATAR */}
          <div className="relative group cursor-pointer">
            <Avatar className="h-16 w-16 bg-white text-black">
              <AvatarImage
                src={
                  image ||
                  (user.profileImage
                    ? `http://localhost:5000${user.profileImage}`
                    : "")
                }
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
              ✏️
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
<h1 className="text-xl font-semibold">{user.name}</h1>
            <p className="text-sm opacity-80">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="bg-white text-black" onClick={() => setOpen(true)}>
            Edit
          </Button>

          <Button className="bg-white text-black" onClick={() => navigate("/student/registrations")}>
            View Registrations
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Reviews</p>
            <p className="text-2xl font-bold">{feedbackHistory.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm mb-1">Name</p>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <Button className="w-full" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentProfile;