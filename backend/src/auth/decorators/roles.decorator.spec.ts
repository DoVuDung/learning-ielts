import { Roles, ROLES_KEY } from './roles.decorator';
import { Role } from '../roles.enum';

describe('Roles Decorator', () => {
  it('should set roles metadata', () => {
    class TestController {
      @Roles(Role.ADMIN)
      adminOnly() {}

      @Roles(Role.USER, Role.ADMIN)
      multipleRoles() {}
    }

    const adminMetadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype.adminOnly,
    );
    expect(adminMetadata).toEqual([Role.ADMIN]);

    const multipleMetadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype.multipleRoles,
    );
    expect(multipleMetadata).toEqual([Role.USER, Role.ADMIN]);
  });
});
