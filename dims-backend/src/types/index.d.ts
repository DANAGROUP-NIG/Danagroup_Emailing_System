import { User as MyUserEntity } from "../modules/users/entities/user.entity";

declare global {
  namespace Express {
    // This adds your specific user properties to req.user
    interface User extends MyUserEntity {}
  }
}
