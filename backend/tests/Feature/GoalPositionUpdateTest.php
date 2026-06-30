<?php

namespace Tests\Feature;

use App\Models\Goal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GoalPositionUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_bulk_update_owned_goal_positions(): void
    {
        $user = User::create([
            'user_id' => 'user-1',
            'user_name' => 'Tester',
            'password' => bcrypt('password'),
        ]);

        $longGoal = Goal::create([
            'user_id' => $user->user_id,
            'title' => 'Long goal',
            'period_type' => 'long',
            'is_completed' => false,
        ]);

        $midGoal = Goal::create([
            'user_id' => $user->user_id,
            'parent_goal_id' => $longGoal->id,
            'title' => 'Mid goal',
            'period_type' => 'middle',
            'is_completed' => false,
        ]);

        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/goals/positions', [
            'positions' => [
                ['goal_id' => $midGoal->id, 'x' => 120.5, 'y' => 0],
            ],
        ]);

        $response->assertOk()
            ->assertJson(['updated' => 1]);

        $this->assertDatabaseHas('goals', [
            'id' => $midGoal->id,
            'position_x' => 120.5,
            'position_y' => 0,
        ]);
    }

    public function test_long_term_goal_position_is_forced_to_origin(): void
    {
        $user = User::create([
            'user_id' => 'user-1',
            'user_name' => 'Tester',
            'password' => bcrypt('password'),
        ]);

        $longGoal = Goal::create([
            'user_id' => $user->user_id,
            'title' => 'Long goal',
            'period_type' => 'long',
            'is_completed' => false,
        ]);

        Sanctum::actingAs($user);

        $response = $this->patchJson('/api/goals/positions', [
            'positions' => [
                ['goal_id' => $longGoal->id, 'x' => 120.5, 'y' => 80],
            ],
        ]);

        $response->assertOk()
            ->assertJson(['updated' => 1]);

        $this->assertDatabaseHas('goals', [
            'id' => $longGoal->id,
            'position_x' => 0,
            'position_y' => 0,
        ]);
    }

    public function test_bulk_update_rejects_foreign_goal_ids(): void
    {
        $owner = User::create([
            'user_id' => 'user-1',
            'user_name' => 'Owner',
            'password' => bcrypt('password'),
        ]);

        $other = User::create([
            'user_id' => 'user-2',
            'user_name' => 'Other',
            'password' => bcrypt('password'),
        ]);

        $foreignGoal = Goal::create([
            'user_id' => $other->user_id,
            'title' => 'Foreign goal',
            'period_type' => 'long',
            'is_completed' => false,
        ]);

        Sanctum::actingAs($owner);

        $response = $this->patchJson('/api/goals/positions', [
            'positions' => [
                ['goal_id' => $foreignGoal->id, 'x' => 10, 'y' => 20],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['invalid_goal_ids' => [$foreignGoal->id]]);
    }
}
