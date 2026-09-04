from video.video_generator import Scene, build_lesson_video


def main():
    scenes = [
        Scene(
            scene_number=1,
            type="introduction",
            text="Hello! Today we are going to learn what XGBoost is.",
            subject="Machine Learning",
            concept="XGBoost",
        ),
        Scene(
            scene_number=2,
            type="explanation",
            text="XGBoost is a gradient boosting algorithm that builds decision trees sequentially.",
            subject="Machine Learning",
            concept="Gradient Boosting",
        ),
    ]

    print("Starting video generation...")

    output_path = build_lesson_video(
        session_id="test_video",
        scenes=scenes,
        language="English",
    )

    print(f"\nVideo generated successfully!")
    print(f"Output: {output_path}")


if __name__ == "__main__":
    main()