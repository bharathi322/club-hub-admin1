import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClubs } from "@/hooks/use-dashboard-api";

const ClubsPage = () => {
  const { data: clubs = [], isLoading } = useClubs();

  const queryClient = useQueryClient(); // ✅ inside component

  // ✅ SOCKET LISTENERS (correct placement)
  useEffect(() => {
    // CREATE
    socket.on("clubCreated", (newClub) => {
      queryClient.setQueryData(["clubs"], (old: any) => {
        if (!old) return [newClub];
        return [...old, newClub];
      });
    });

    // UPDATE
    socket.on("clubUpdated", (updatedClub) => {
      queryClient.setQueryData(["clubs"], (old: any) => {
        if (!old) return [];
        return old.map((c: any) =>
          c._id === updatedClub._id ? updatedClub : c
        );
      });
    });

    // DELETE
    socket.on("clubDeleted", (id) => {
      queryClient.setQueryData(["clubs"], (old: any) => {
        if (!old) return [];
        return old.filter((c: any) => c._id !== id);
      });
    });

    // BUDGET UPDATE
    socket.on("clubBudgetUpdated", (updatedClub) => {
      queryClient.setQueryData(["clubs"], (old: any) => {
        if (!old) return [];
        return old.map((c: any) =>
          c._id === updatedClub._id ? updatedClub : c
        );
      });
    });

    return () => {
      socket.off("clubCreated");
      socket.off("clubUpdated");
      socket.off("clubDeleted");
      socket.off("clubBudgetUpdated");
    };
  }, [queryClient]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Clubs</h1>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {clubs.map((club: any) => (
            <Card key={club._id}>
              <CardHeader>
                <CardTitle>{club.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Members: {club.membersCount}</p>
                <p>Rating: {club.rating}</p>
                <p>Status: {club.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubsPage;