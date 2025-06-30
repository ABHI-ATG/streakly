import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import API_BASE_URL from "../Api";
import "./Home.css";
import axios from "axios";

const Home = () => {
  const location = useLocation();
  const username = location.state?.username || "Guest";

  const [activity, setActivity] = useState("");
  const [activities, setActivities] = useState([]);
  const [statusToday, setStatusToday] = useState([]);
  const [forEachDate, setForEachDate] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!username || username === "Guest") {
        window.location.href = "/";
        return;
      }

      setLoading(true); // Start loading
      try {
        const response = await axios.post(`${API_BASE_URL}/api/users/create`, {
          name: username,
        });

        const allStatus = response.data.data.status || [];
        const today = new Date().toISOString().split("T")[0];
        const todayStatus = allStatus.find((s) => s.date === today);

        if (todayStatus) {
          setStatusToday(todayStatus.activity || []);
        } else {
          setStatusToday(
            response.data.data.activities.map((act) => ({
              name: act,
              completed: false,
            }))
          );
        }

        console.log(allStatus);
        allStatus.forEach((status) => {
          const date = status.date;
          const length = status.activity.length;
          let done = 0;
          status.activity.forEach((act) => {
            if (act.completed) done++;
          });
          setForEachDate((prev) => ({
            ...prev,
            [date]: { length, done, status: status.activity },
          }));
        });

        setActivities(response.data.data.activities || []);
        setActivity(""); // Reset input field
        console.log("User created or fetched:", response.data.data);
      } catch (err) {
        console.error(
          "Error creating user:",
          err.response?.data || err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  const updateActivitiesOnServer = async (newActivities) => {
    try {
      await axios.post(`${API_BASE_URL}/api/users/addActivities`, {
        name: username,
        activities: newActivities,
      });
    } catch (err) {
      console.error(
        "Error updating activities:",
        err.response?.data || err.message
      );
    }
  };

  const handleAddActivity = () => {
    if (activity.trim() !== "" && !activities.includes(activity)) {
      const updated = [...activities, activity];
      setActivities(updated);
      setStatusToday([...statusToday, { name: activity, completed: false }]);
      updateActivitiesOnServer(updated);
      setActivity("");
    }
  };

  const handleDeleteActivity = (index) => {
    const updated = activities.filter((_, i) => i !== index);
    setActivities(updated);
    setStatusToday(statusToday.filter((a) => a.name !== activities[index]));
    updateActivitiesOnServer(updated);
  };

  const toggleCompleted = async (activityName) => {
    try {
      await axios.post(`${API_BASE_URL}/api/users/complete`, {
        name: username,
        activity: activityName,
      });

      // Update statusToday state as before
      setStatusToday((prevStatus) =>
        prevStatus.map((a) =>
          a.name === activityName ? { ...a, completed: !a.completed } : a
        )
      );

      // Also update forEachDate for today's date locally
      const todayISO = new Date().toISOString().split("T")[0];

      setForEachDate((prev) => {
        const todayData = prev[todayISO];
        if (!todayData) return prev;

        // Find updated activity array for today
        const updatedActivities = todayData.status.map((act) =>
          act.name === activityName
            ? { ...act, completed: !act.completed }
            : act
        );

        const doneCount = updatedActivities.filter((a) => a.completed).length;

        return {
          ...prev,
          [todayISO]: {
            ...todayData,
            done: doneCount,
            status: updatedActivities,
          },
        };
      });
    } catch (err) {
      console.error(
        "Error marking complete:",
        err.response?.data || err.message
      );
    }
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const generateYearDays = () => {
    const days = [];
    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d).toISOString().split("T")[0]);
    }

    return days;
  };

  const yearDays = generateYearDays();

  return (
    <>
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <div className="loading-text">Loading...</div>
        </div>
      ) : (
        <div className="home-container">
          <h1>Welcome, {username}!</h1>

          <div className="streak-chart">
            <h2>Yearly Streak</h2>
            <div className="grid">
              {yearDays.map((date, index) => (
                <div
                  key={index}
                  className="grid-block"
                  style={{
                    backgroundColor:
                      forEachDate[date] && forEachDate[date].done
                        ? `rgba(0, 128, 0, ${
                            forEachDate[date].done / forEachDate[date].length
                          })`
                        : "rgb(240, 240, 240)",
                  }}
                  title={date}
                >
                  {forEachDate[date] && (
                    <div className="tooltip">
                      <strong>{date}</strong>
                      <ul>
                        {forEachDate[date].status.map((act, i) => (
                          <li key={i}>
                            {act.completed ? "✅" : "❌"} {act.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="activities-checklist">
            <h2>Activity Checklist:</h2>
            <p className="date">{today}</p>
            {statusToday.length === 0 ? (
              <p>No activities to track.</p>
            ) : (
              <ul>
                {console.log("Status Today:", statusToday)}
                {statusToday.map((item, index) => (
                  <li key={index} className={item.completed ? "completed" : ""}>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleCompleted(item.name)}
                    />
                    {item.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="activities-list">
            <h2>Your Activities:</h2>
            {activities.length === 0 ? (
              <p>No activities added yet.</p>
            ) : (
              <ul>
                {activities.map((item, index) => (
                  <li key={index}>
                    {item}
                    <button onClick={() => handleDeleteActivity(index)}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="activity-input">
            <input
              type="text"
              placeholder="Enter an activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            />
            <button onClick={handleAddActivity}>Add Activity</button>
          </div>

          <h5>© Abhi Singhal</h5>
        </div>
      )}
    </>
  );
};

export default Home;
