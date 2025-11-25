# cli_backfill.py

from flask.cli import with_appcontext
import click

from dbModels import db, Topic
from topic_embeddings_loader import compute_topic_embeddings_for_course, compute_topic_polylines_for_course


@click.command("backfill-topics")
@with_appcontext
def backfill_topics():
    """
    flask backfill-topics
    """
    course_ids = [
        cid for (cid,) in db.session.query(Topic.course_id).distinct().all()
        if cid is not None
    ]
    click.echo(f"Found {len(course_ids)} course(s) with topics.")

    for cid in course_ids:
        click.echo(f"Processing course_id={cid} ...")
        compute_topic_embeddings_for_course(cid, commit=True)
        compute_topic_polylines_for_course(cid, commit=True)
        click.echo(f"  -> done course_id={cid}")

    click.echo("Backfill complete.")
