class Storage:
    def __init__(self):
        self.last_plan = None

    def save_plan(self, plan: dict):
        self.last_plan = plan

    def get_plan(self):
        return self.last_plan

store = Storage()
