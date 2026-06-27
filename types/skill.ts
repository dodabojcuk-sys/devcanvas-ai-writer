export type SkillType = "global" | "agent" | "persona";

export type SkillAttachPoint =
  | "global_writing_pipeline"
  | "agent_output"
  | "character_behavior";

export interface DevCanvasSkill {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  scope: SkillAttachPoint;
  inactive: true;
}

export type GlobalSkill = DevCanvasSkill & {
  type: "global";
  scope: "global_writing_pipeline";
};

export type AgentSkill = DevCanvasSkill & {
  type: "agent";
  scope: "agent_output";
};

export type PersonaSkill = DevCanvasSkill & {
  type: "persona";
  scope: "character_behavior";
};
