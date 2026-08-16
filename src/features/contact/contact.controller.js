import ContactQuery from "./contact.model.js";

export const createContactQuery = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    const newQuery = await ContactQuery.create({ name, email, subject, message });

    // Enqueue email
    import("../email/email.queue.js").then((module) => {
      module.enqueueContactUsEmail(name, email, subject, message);
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully. We will get back to you soon.",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllContactQueries = async (req, res, next) => {
  try {
    const queries = await ContactQuery.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      queries,
    });
  } catch (error) {
    next(error);
  }
};

export const updateContactQueryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const query = await ContactQuery.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!query) {
      return res.status(404).json({ success: false, message: "Query not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Query marked as ${status}`,
      query,
    });
  } catch (error) {
    next(error);
  }
};
