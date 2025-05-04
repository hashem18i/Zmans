document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('zmanim-container');
    if (!container) {
        console.error('Zmanim container not found');
        return;
    }
    container.innerHTML = ''; // Clear "Loading..." message

    // Montreal, QC Coordinates and Timezone
    const latitude = 45.5017;
    const longitude = -73.5673;
    const timeZoneId = 'America/Toronto'; // Montreal uses this timezone database ID
    const elevation = 30; // Approximate elevation in meters

    const location = new KosherZmanim.GeoLocation('Montreal', latitude, longitude, elevation, timeZoneId);

    const today = new Date();

    // Options for formatting dates and times
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }; // e.g., 07:30:00 AM

    for (let i = 0; i < 8; i++) { // Current day + next 7 days
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);

        // Use ComplexZmanimCalendar for more zmanim options
        const zmanimCalendar = new KosherZmanim.ComplexZmanimCalendar(location);
        zmanimCalendar.setDate(currentDate);

        // Create elements to display the zmanim for this day
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-zmanim';

        const dateHeading = document.createElement('h2');
        dateHeading.textContent = currentDate.toLocaleDateString('en-US', dateOptions);
        dayDiv.appendChild(dateHeading);

        const zmanimList = document.createElement('ul');

        // Define which zmanim to display
        const zmanimToShow = [
            { name: 'Alos Hashachar (Dawn - 16.1°)', time: zmanimCalendar.getAlosHashachar() },
            { name: 'Misheyakir (Earliest Talis/Tefillin)', time: zmanimCalendar.getMisheyakir() },
            { name: 'Sunrise', time: zmanimCalendar.getSunrise() },
            { name: 'Sof Zman Shma (Gra)', time: zmanimCalendar.getSofZmanShmaGRA() },
            { name: 'Sof Zman Shma (MGA)', time: zmanimCalendar.getSofZmanShmaMGA() },
            { name: 'Sof Zman Tefillah (Gra)', time: zmanimCalendar.getSofZmanTfilaGRA() },
            { name: 'Sof Zman Tefillah (MGA)', time: zmanimCalendar.getSofZmanTfilaMGA() },
            { name: 'Chatzos (Midday)', time: zmanimCalendar.getChatzos() },
            { name: 'Mincha Gedola (Gra)', time: zmanimCalendar.getMinchaGedola() },
            { name: 'Mincha Ketana (Gra)', time: zmanimCalendar.getMinchaKetana() },
            { name: 'Plag Hamincha', time: zmanimCalendar.getPlagHamincha() },
            { name: 'Sunset', time: zmanimCalendar.getSunset() },
            { name: 'Tzais (Nightfall - 8.5°)', time: zmanimCalendar.getTzais() },
            { name: 'Tzais 72min (Rabbeinu Tam)', time: zmanimCalendar.getTzais72Zmanis() }, // Example of 72 Zmanis
            // You can add more zmanim from the library documentation if needed
        ];

        zmanimToShow.forEach(zman => {
            const listItem = document.createElement('li');
            const timeString = zman.time
                ? new Date(zman.time).toLocaleTimeString('en-US', timeOptions)
                : 'N/A'; // Handle cases where a zman might not be calculable

            listItem.innerHTML = `<strong>${zman.name}:</strong> <span>${timeString}</span>`;
            zmanimList.appendChild(listItem);
        });

        dayDiv.appendChild(zmanimList);
        container.appendChild(dayDiv);
    }

    // Add note about Parsha after zmanim list (optional)
    try {
        const jewishCalendar = new KosherZmanim.JewishCalendar(today); // Use today for Parsha
        jewishCalendar.setInIsrael(false); // Diaspora
        const parsha = jewishCalendar.getParshaName("en"); // Get Parsha name in English
        if (parsha) {
             const parshaElement = document.createElement('p');
             parshaElement.innerHTML = `<strong>This week's Parsha:</strong> ${parsha}`;
             parshaElement.style.textAlign = 'center';
             parshaElement.style.marginTop = '20px';
             container.appendChild(parshaElement);
        }

    } catch (e) {
        console.error("Could not fetch Parsha info:", e);
    }


});
