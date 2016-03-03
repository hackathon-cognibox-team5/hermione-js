define(['Hermione'], function (Hermione) {
  return Hermione.extend({
    name: "employee",
    baseUrl: "",
    attrs: {
      id: {},
      firstName: { validations: { length: { maximum: 20 } } },
      lastName: { validations: { length: { maximum: 20 } } }
    }
  });
});