// slotScheduler.js
const cron = require("node-cron");
const SlotModel = require("./models/SlotModel");
const DoctorModel = require("./models/DoctorModel");
const slotsConfig = [
  "09:00 AM - 09:30 AM",
  "09:30 AM - 10:00 AM",
  "10:00 AM - 10:30 AM",
  "10:30 AM - 11:00 AM",
  "11:00 AM - 11:30 AM",
  // Add more slots as needed
  "04:30 PM - 05:00 PM",
];

// Schedule task to run at midnight (00:00)
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Generating slots for the next 7 days...");

    // Get all doctors
    const doctors = await DoctorModel.findAll();

    for (let i = 1; i <= 7; i++) {
      // Get date for each of the next 7 days
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      const formattedDate = targetDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD

      // Create slots for each doctor
      for (const doctor of doctors) {
        for (const slot of slotsConfig) {
          // Check if the slot already exists (in case of retries/failures)
          const existingSlot = await SlotModel.findOne({
            where: {
              doctorId: doctor.id,
              date: formattedDate,
              slot,
            },
          });

          if (!existingSlot) {
            // Create new slot
            await SlotModel.create({
              doctorId: doctor.id,
              date: formattedDate,
              slot,
              is_available: true,
            });
          }
        }
      }
    }

    console.log("Slots created for the next 7 days");
  } catch (error) {
    console.error("Error creating slots:", error.message);
  }
});

cron.schedule("0 1 * * *", async () => {
  // Runs at 1:00 AM
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight

    await SlotModel.destroy({
      where: {
        date: { [Op.lt]: today }, // Remove slots with dates older than today
      },
    });

    console.log("Old slots cleaned up");
  } catch (error) {
    console.error("Error cleaning up slots:", error.message);
  }
});
