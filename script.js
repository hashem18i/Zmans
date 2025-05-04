// === Start copying here ===
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('zmanim-container');
    if (!container) {
        console.error('Zmanim container not found');
        return; // Stop if container doesn't exist
    }

    try {
        // Check if the library loaded
        if (typeof KosherZmanim === 'undefined') {
            container.innerHTML = '<p style="color: red;">Error: KosherZmanim library did not load.</p>';
            console.error('KosherZmanim library is undefined.');
            return;
        }

        // Montreal Location Details
        const latitude = 45.5017;
        const longitude = -73.5673;
        const timeZoneId = 'America/Toronto';
        const elevation = 30; // Optional, but good practice

        const location = new KosherZmanim.GeoLocation('Montreal', latitude, longitude, elevation, timeZoneId);
        const today = new Date();
        const zmanimCalendar = new KosherZmanim.ComplexZmanimCalendar(location);
        zmanimCalendar.setDate(today);

        // Get Sunrise Time
        const sunriseDate = zmanimCalendar.getSunrise();

        // Format the time
        let sunriseTimeString = 'N/A';
        if (sunriseDate) {
            sunriseTimeString = sunriseDate.toLocaleTimeString('en-US', {
                 hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: timeZoneId
            });
        } else {
             console.error("Could not calculate sunrise.");
        }

        // Display the result
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timeZoneId };
        container.innerHTML = `
            <h2>Today (${today.toLocaleDateString('en-US', dateOptions)})</h2>
            <p><strong>Sunrise:</strong> ${sunriseTimeString}</p>
        `;
        console.log("Successfully calculated and displayed sunrise:", sunriseTimeString);

    } catch (error) {
        // Display any error that occurs
        console.error('An error occurred:', error);
        container.innerHTML = `<p style="color: red;">An error occurred: ${error.message}. Check the console (F12).</p>`;
    }
});

// Basic check outside the event listener to see if script runs at all
console.log("Simple script.js file loaded and running.");
// === Stop copying here ===
