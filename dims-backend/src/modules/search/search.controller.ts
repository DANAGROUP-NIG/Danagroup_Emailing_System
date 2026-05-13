import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { UsersSearchService } from "@modules/users/users-search.service";
import { SearchQueryDto } from "./dto/search-query.dto";

@ApiTags("search")
@ApiBearerAuth()
@Controller("search")
export class SearchController {
  constructor(private readonly usersSearchService: UsersSearchService) {}

  @Get()
  @ApiOperation({
    summary: "Unified search across users and mail (type: all | users | mail)",
  })
  @ApiResponse({ status: 200, description: "Search results returned" })
  async search(
    @Query() query: SearchQueryDto,
    @CurrentUser() user: { userId: string },
  ) {
    const results = await this.usersSearchService.unifiedSearch(
      query.q,
      query.type ?? "all",
      user.userId,
      query.page ?? 1,
      query.limit ?? 10,
      {
        department: query.department,
        subsidiary: query.subsidiary,
        role: query.role,
      },
    );
    return {
      data: {
        results: results.results,
        total: results.total,
        page: results.page,
        limit: query.limit ?? 10,
      },
    };
  }
}
