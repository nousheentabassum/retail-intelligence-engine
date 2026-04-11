export class Supplier {
  constructor({ id, name, leadTimeDays = 7, reliabilityScore = 0.9 }) {
    this.id = id;
    this.name = name;
    this.leadTimeDays = leadTimeDays;
    this.reliabilityScore = reliabilityScore;
  }
}

