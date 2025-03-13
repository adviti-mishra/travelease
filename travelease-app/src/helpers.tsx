const handleTestStoreSummary = async () => {
  if (!user) {
    alert("You need to sign in first!");
    return;
  }

  const dummySummary = {
    content: "This is a test summary.",
  };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token; // Correctly extract token

    if (!accessToken) {
      alert("No session token found. Please log in again.");
      return;
    }

    const response = await fetch("http://127.0.0.1:5000/summaries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(dummySummary),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Test Summary Saved Successfully!");
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    console.error("Error storing test summary:", error);
    alert("Failed to store summary.");
  }
};

const fetchSummaries = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    alert("You need to log in first");
    return;
  }

  const user_id = data.user.id;

  const response = await fetch(`http://127.0.0.1:5000/summaries?user_id=${user_id}`);
  const summaries = await response.json();
  alert(JSON.stringify(summaries, null, 2));
};
