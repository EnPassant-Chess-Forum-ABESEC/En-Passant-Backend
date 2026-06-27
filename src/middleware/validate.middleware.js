export const validate = (schema) => async (req, res, next) => {
  try {
    const validated = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (validated.body) req.body = validated.body;
    if (validated.query) Object.assign(req.query, validated.query);
    if (validated.params) Object.assign(req.params, validated.params);

    next();
  } catch (error) {
    next(error);
  }
};
